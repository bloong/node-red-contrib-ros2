const crypto = require('crypto');

module.exports = function(RED) {
    const rclnodejs = require('rclnodejs');
    
    // Global state management
    let isInitialized = false;
    let isInitializing = false;
    let nodeCount = 0;
    const pendingInitCallbacks = [];
    
    // ROS2 Initialization Manager
    const Ros2Manager = {
        async init() {
            if (isInitialized) return true;
            if (isInitializing) {
                return new Promise((resolve) => {
                    pendingInitCallbacks.push(resolve);
                });
            }
            
            isInitializing = true;
            try {
                console.log("[ROS2] Initializing ROS2...");
                
                // Check required environment
                if (!process.env.ROS_DISTRO) {
                    console.warn("[ROS2] ROS_DISTRO not set. Ensure ROS2 is sourced.");
                }
                
                // Initialize rclnodejs with default context
                await rclnodejs.init();
                isInitialized = true;
                console.log("[ROS2] Initialized successfully");
                
                // Resolve all pending initializations
                pendingInitCallbacks.forEach(cb => cb(true));
                pendingInitCallbacks.length = 0;
                return true;
            } catch (err) {
                console.error("[ROS2] Initialization failed:", err.message);
                isInitializing = false;
                pendingInitCallbacks.forEach(cb => cb(false));
                pendingInitCallbacks.length = 0;
                throw err;
            } finally {
                isInitializing = false;
            }
        },

        createNode(name) {
            if (!isInitialized) {
                throw new Error("ROS2 not initialized");
            }
            return new rclnodejs.Node(name);
        },

        async shutdown() {
            if (isInitialized) {
                try {
                    console.log("[ROS2] Shutting down ROS2");
                    await rclnodejs.shutdown();
                    console.log("[ROS2] Shutdown complete");
                } catch (err) {
                    console.error("[ROS2] Shutdown error:", err.message);
                } finally {
                    isInitialized = false;
                }
            }
        }
    };

    // Generate safe node name
    function generateSafeNodeName(prefix, id) {
        const hash = crypto.createHash('md5').update(id).digest('hex').substring(0, 8);
        return `nr_${prefix}_${hash}`;
    }

    // Convert message type to correct format for rclnodejs
    function normalizeMessageType(msgtype) {
        const [pkg, type] = msgtype.split('/');
        const normalizedType = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
        return `${pkg}/msg/${normalizedType}`;
    }

    // ROS2 Subscriber Node
    function Ros2InNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.topic = config.topic;
        node.msgtype = config.msgtype;
        node.qos = parseInt(config.qos) || 0;
        node.rosNode = null;
        node.subscription = null;
        node.active = true;

        node.status({fill:"yellow", shape:"ring", text:"initializing"});

        const initRos = async () => {
            try {
                if (!(await Ros2Manager.init())) {
                    throw new Error("ROS2 initialization failed");
                }
                nodeCount++;
                
                const nodeName = generateSafeNodeName("sub", node.id);
                node.rosNode = Ros2Manager.createNode(nodeName);
                
                // Normalize and load message type
                const normalizedType = normalizeMessageType(node.msgtype);
                const msgType = rclnodejs.require(normalizedType);
                
                const qosProfile = {
                    reliability: node.qos === 1 ? 
                        rclnodejs.QoS.ReliabilityPolicy.RELIABLE :
                        rclnodejs.QoS.ReliabilityPolicy.BEST_EFFORT,
                    history: rclnodejs.QoS.HistoryPolicy.KEEP_LAST,
                    depth: 10
                };
                
                node.subscription = node.rosNode.createSubscription(
                    msgType,
                    node.topic,
                    qosProfile,
                    (msg) => {
                        if (node.active) {
                            try {
                                node.send({ 
                                    payload: msg,
                                    topic: node.topic,
                                    _rosmsg: msg
                                });
                            } catch (sendErr) {
                                console.error("[ROS2] Send error:", sendErr.message);
                            }
                        }
                    }
                );
                
                node.rosNode.spin();
                node.status({fill:"green", shape:"dot", text:"connected"});
                console.log(`[ROS2] Subscriber created for ${node.topic} with type ${normalizedType}`);
            } catch (err) {
                if (node.active) {
                    node.error(`ROS2 init failed: ${err.message}`);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
                console.error(`[ROS2] Subscriber error for ${node.msgtype}: ${err.stack}`);
            }
        };

        setTimeout(initRos, 100);

        node.on('close', async (done) => {
            node.active = false;
            nodeCount--;
            
            try {
                if (node.subscription && node.rosNode) {
                    try {
                        node.rosNode.destroySubscription(node.subscription);
                    } catch (err) {
                        console.error("Subscription destroy error:", err.message);
                    }
                }
                
                if (node.rosNode) {
                    try {
                        node.rosNode.destroy();
                    } catch (err) {
                        console.error("Node destroy error:", err.message);
                    }
                }
            } catch (destroyErr) {
                console.error("[ROS2] Destroy error:", destroyErr.message);
            }
            
            if (nodeCount === 0) {
                setTimeout(async () => {
                    if (nodeCount === 0) {
                        try {
                            await Ros2Manager.shutdown();
                        } catch (shutdownErr) {
                            console.error("[ROS2] Shutdown error:", shutdownErr.message);
                        }
                    }
                    done();
                }, 3000);
            } else {
                done();
            }
        });
    }

    // ROS2 Publisher Node (修复数值类型处理)
    function Ros2OutNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.topic = config.topic;
        node.msgtype = config.msgtype;
        node.qos = parseInt(config.qos) || 0;
        node.rosNode = null;
        node.publisher = null;
        node.messageQueue = [];
        node.active = true;
        node.resetTimer = null;

        node.status({fill:"yellow", shape:"ring", text:"initializing"});

        const initRos = async () => {
            try {
                if (!(await Ros2Manager.init())) {
                    throw new Error("ROS2 initialization failed");
                }
                nodeCount++;
                
                const nodeName = generateSafeNodeName("pub", node.id);
                node.rosNode = Ros2Manager.createNode(nodeName);
                
                // Normalize and load message type
                const normalizedType = normalizeMessageType(node.msgtype);
                const msgType = rclnodejs.require(normalizedType);
                
                const qosProfile = {
                    reliability: node.qos === 1 ? 
                        rclnodejs.QoS.ReliabilityPolicy.RELIABLE :
                        rclnodejs.QoS.ReliabilityPolicy.BEST_EFFORT,
                    history: rclnodejs.QoS.HistoryPolicy.KEEP_LAST,
                    depth: 10
                };
                
                node.publisher = node.rosNode.createPublisher(
                    msgType,
                    node.topic,
                    qosProfile
                );
                
                node.rosNode.spin();
                node.status({fill:"green", shape:"dot", text:"connected"});
                console.log(`[ROS2] Publisher created for ${node.topic} with type ${normalizedType}`);
                
                // Process queued messages
                while (node.messageQueue.length > 0) {
                    const msg = node.messageQueue.shift();
                    try {
                        publishMessage(msg);
                    } catch (err) {
                        console.error("[ROS2] Queued message error:", err.message);
                    }
                }
            } catch (err) {
                if (node.active) {
                    node.error(`ROS2 init failed: ${err.message}`);
                    node.status({fill:"red", shape:"ring", text:"error"});
                }
                console.error(`[ROS2] Publisher error for ${node.msgtype}: ${err.stack}`);
            }
        };

        const publishMessage = (msg) => {
            if (!node.active || !node.publisher) return;
            
            try {
                // Normalize and load message type
                const normalizedType = normalizeMessageType(node.msgtype);
                const MsgType = rclnodejs.require(normalizedType);
                const rosMsg = new MsgType();
                
                // 数值类型处理辅助函数
                const handleNumericValue = (value, isInt = false) => {
                    if (value === null || value === undefined) return 0;
                    
                    if (typeof value === 'number') {
                        return isInt ? Math.trunc(value) : value;
                    }
                    
                    if (typeof value === 'string') {
                        // 尝试转换数字字符串
                        const num = isInt ? parseInt(value, 10) : parseFloat(value);
                        if (!isNaN(num)) return num;
                        
                        // 布尔值字符串处理
                        if (value.toLowerCase() === 'true') return 1;
                        if (value.toLowerCase() === 'false') return 0;
                    }
                    
                    // 布尔值直接转换
                    if (typeof value === 'boolean') {
                        return value ? 1 : 0;
                    }
                    
                    // 无法转换时记录警告
                    node.warn(`无法转换为${isInt ? '整数' : '浮点数'}: ${value}`);
                    return 0;
                };

                // 特殊处理常见消息类型
                switch(node.msgtype) {
                    case 'std_msgs/Int32':
                    case 'std_msgs/Int64':
                    case 'std_msgs/Int8':
                        rosMsg.data = handleNumericValue(msg.payload, true);
                        break;
                        
                    case 'std_msgs/UInt32':
                    case 'std_msgs/UInt64':
                    case 'std_msgs/UInt8':
                        // 确保无符号整数非负
                        const uintValue = handleNumericValue(msg.payload, true);
                        rosMsg.data = Math.max(0, uintValue);
                        break;
                        
                    case 'std_msgs/Float32':
                    case 'std_msgs/Float64':
                        rosMsg.data = handleNumericValue(msg.payload);
                        break;
                        
                    case 'std_msgs/String':
                        rosMsg.data = String(msg.payload);
                        break;
                        
                    case 'std_msgs/Bool':
                        // 精确的布尔值转换
                        if (typeof msg.payload === 'string') {
                            rosMsg.data = msg.payload.toLowerCase() === 'true' || msg.payload === '1';
                        } else {
                            rosMsg.data = !!msg.payload;
                        }
                        break;
                        
                    case 'geometry_msgs/Point':
                        if (typeof msg.payload === 'object') {
                            rosMsg.x = handleNumericValue(msg.payload.x);
                            rosMsg.y = handleNumericValue(msg.payload.y);
                            rosMsg.z = handleNumericValue(msg.payload.z);
                        } else {
                            rosMsg.x = 0;
                            rosMsg.y = 0;
                            rosMsg.z = 0;
                        }
                        break;
                        
                    case 'geometry_msgs/Pose':
                        if (typeof msg.payload === 'object') {
                            if (msg.payload.position) {
                                rosMsg.position.x = handleNumericValue(msg.payload.position.x);
                                rosMsg.position.y = handleNumericValue(msg.payload.position.y);
                                rosMsg.position.z = handleNumericValue(msg.payload.position.z);
                            }
                            if (msg.payload.orientation) {
                                rosMsg.orientation.x = handleNumericValue(msg.payload.orientation.x);
                                rosMsg.orientation.y = handleNumericValue(msg.payload.orientation.y);
                                rosMsg.orientation.z = handleNumericValue(msg.payload.orientation.z);
                                rosMsg.orientation.w = handleNumericValue(msg.payload.orientation.w);
                            }
                        }
                        break;
                        
                    case 'geometry_msgs/Twist':
                        if (typeof msg.payload === 'object') {
                            if (msg.payload.linear) {
                                rosMsg.linear.x = handleNumericValue(msg.payload.linear.x);
                                rosMsg.linear.y = handleNumericValue(msg.payload.linear.y);
                                rosMsg.linear.z = handleNumericValue(msg.payload.linear.z);
                            }
                            if (msg.payload.angular) {
                                rosMsg.angular.x = handleNumericValue(msg.payload.angular.x);
                                rosMsg.angular.y = handleNumericValue(msg.payload.angular.y);
                                rosMsg.angular.z = handleNumericValue(msg.payload.angular.z);
                            }
                        }
                        break;
                        
                    default:
                        // 处理原始数值类型
                        if (typeof msg.payload === 'number') {
                            if (rosMsg.hasOwnProperty('data')) {
                                rosMsg.data = msg.payload;
                            } else {
                                node.warn(`消息类型 ${node.msgtype} 没有'data'属性，无法直接赋值数值`);
                            }
                        } 
                        // 处理对象类型
                        else if (typeof msg.payload === 'object' && msg.payload !== null) {
                            for (const key in msg.payload) {
                                if (rosMsg.hasOwnProperty(key)) {
                                    const value = msg.payload[key];
                                    
                                    // 根据目标字段类型进行转换
                                    if (typeof rosMsg[key] === 'number') {
                                        rosMsg[key] = handleNumericValue(value);
                                    } else {
                                        rosMsg[key] = value;
                                    }
                                }
                            }
                        }
                        // 处理非对象的基本类型
                        else if (rosMsg.hasOwnProperty('data')) {
                            if (typeof rosMsg.data === 'number') {
                                rosMsg.data = handleNumericValue(msg.payload);
                            } else {
                                rosMsg.data = msg.payload;
                            }
                        }
                }
                
                node.publisher.publish(rosMsg);
                
                // 安全的状态更新
                if (node.active) {
                    node.status({fill:"blue", shape:"dot", text:"sent"});
                    
                    // 清除之前的定时器
                    if (node.resetTimer) {
                        clearTimeout(node.resetTimer);
                        node.resetTimer = null;
                    }
                    
                    // 安全地设置状态重置定时器
                    node.resetTimer = setTimeout(() => {
                        try {
                            if (node.active && node.status) {
                                node.status({fill:"green", shape:"dot", text:"connected"});
                            }
                        } catch (statusErr) {
                            console.error("[ROS2] Status update error:", statusErr.message);
                        }
                    }, 500);
                }
            } catch (err) {
                if (node.active) {
                    node.error(`Publish failed: ${err.message}`);
                    node.status({fill:"red", shape:"ring", text:"publish error"});
                }
            }
        };

        setTimeout(initRos, 100);

        node.on('input', (msg) => {
            if (!node.active) return;
            
            if (!node.publisher) {
                node.messageQueue.push(msg);
                if (node.active) {
                    node.status({fill:"yellow", shape:"ring", text:`queued: ${node.messageQueue.length}`});
                }
                return;
            }
            publishMessage(msg);
        });

        node.on('close', async (done) => {
            node.active = false;
            
            // 清除所有定时器
            if (node.resetTimer) {
                clearTimeout(node.resetTimer);
                node.resetTimer = null;
            }
            
            // 清空消息队列
            node.messageQueue = [];
            
            nodeCount--;
            
            try {
                if (node.publisher && node.rosNode) {
                    try {
                        node.rosNode.destroyPublisher(node.publisher);
                    } catch (err) {
                        console.error("Publisher destroy error:", err.message);
                    }
                }
                
                if (node.rosNode) {
                    try {
                        node.rosNode.destroy();
                    } catch (err) {
                        console.error("Node destroy error:", err.message);
                    }
                }
            } catch (destroyErr) {
                console.error("[ROS2] Destroy error:", destroyErr.message);
            }
            
            if (nodeCount === 0) {
                setTimeout(async () => {
                    if (nodeCount === 0) {
                        try {
                            await Ros2Manager.shutdown();
                        } catch (shutdownErr) {
                            console.error("[ROS2] Shutdown error:", shutdownErr.message);
                        }
                    }
                    done();
                }, 3000);
            } else {
                done();
            }
        });
    }

    // Register nodes
    RED.nodes.registerType("ros2-in", Ros2InNode);
    RED.nodes.registerType("ros2-out", Ros2OutNode);

    // Cleanup on Node-RED shutdown
    RED.events.on("nodes-stopped", async () => {
        if (nodeCount > 0) {
            console.log("[ROS2] Forcing shutdown");
            try {
                await Ros2Manager.shutdown();
            } catch (shutdownErr) {
                console.error("[ROS2] Forced shutdown error:", shutdownErr.message);
            }
            nodeCount = 0;
        }
    });
    
    console.log("[ROS2] Nodes registered successfully");
};