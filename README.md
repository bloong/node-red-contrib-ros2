 
 node-red-contrib-ros2
=================
安装方式：
在node-red目录下安装
```
ub2204@ub2204:~/.node-red$ npm install node-red-contrib-ros2
```

或者全局安装
```
ub2204@ub2204:~/.node-red$ sudo npm install -g node-red-contrib-ros2
```


 流程文件导入

 1. 打开Node-RED，点击左上角的齿轮按钮，选择导入，选择导入的流程文件。
 2. 点击左侧的调试按钮，打开调试面板，点击绿色的播放按钮，开始运行流程。
 3. 点击左侧的调试按钮，点击红色的停止按钮，停止运行流程。

 流程示例

```
 [
    {
        "id": "b7f7c0c7d8e1a0e6",
        "type": "tab",
        "label": "ROS2 测试",
        "disabled": false,
        "info": "",
        "env": []
    },
    {
        "id": "a1d8c0d4.1b0c58",
        "type": "inject",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "发布字符串消息",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": "3",
        "topic": "",
        "payload": "Hello ROS2 from Node-RED123",
        "payloadType": "str",
        "x": 230,
        "y": 120,
        "wires": [
            [
                "d1c7c9f7.4d7b4"
            ]
        ]
    },
    {
        "id": "d1c7c9f7.4d7b4",
        "type": "ros2-out",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "字符串发布者",
        "topic": "node_red_chat",
        "msgtype": "std_msgs/String",
        "qos": "0",
        "x": 460,
        "y": 120,
        "wires": []
    },
    {
        "id": "a3d7c0d4.1b0c59",
        "type": "inject",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "发布数字消息",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": "3",
        "topic": "",
        "payload": "-123456.789",
        "payloadType": "json",
        "x": 220,
        "y": 180,
        "wires": [
            [
                "b2c7c9f7.4d7b5"
            ]
        ]
    },
    {
        "id": "b2c7c9f7.4d7b5",
        "type": "ros2-out",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "数字发布者",
        "topic": "node_red_number",
        "msgtype": "std_msgs/Float64",
        "qos": "0",
        "x": 460,
        "y": 180,
        "wires": []
    },
    {
        "id": "c3d7c0d4.1b0c60",
        "type": "inject",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "发布位置消息",
        "props": [
            {
                "p": "payload"
            }
        ],
        "repeat": "1",
        "crontab": "",
        "once": true,
        "onceDelay": "3",
        "topic": "",
        "payload": "{\"x\": 1.5, \"y\": 2.3, \"z\": 0.8}",
        "payloadType": "json",
        "x": 220,
        "y": 240,
        "wires": [
            [
                "c4c7c9f7.4d7b6"
            ]
        ]
    },
    {
        "id": "c4c7c9f7.4d7b6",
        "type": "ros2-out",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "位置发布者",
        "topic": "node_red_position",
        "msgtype": "geometry_msgs/Point",
        "qos": "0",
        "x": 460,
        "y": 240,
        "wires": []
    },
    {
        "id": "d5d7c0d4.1b0c61",
        "type": "ros2-in",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "聊天订阅者",
        "topic": "node_red_chat",
        "msgtype": "std_msgs/String",
        "qos": "0",
        "x": 460,
        "y": 320,
        "wires": [
            [
                "e6d7c0d4.1b0c62"
            ]
        ]
    },
    {
        "id": "e6d7c0d4.1b0c62",
        "type": "debug",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "调试聊天消息",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 690,
        "y": 320,
        "wires": []
    },
    {
        "id": "f7d7c0d4.1b0c63",
        "type": "ros2-in",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "数字订阅者",
        "topic": "node_red_number",
        "msgtype": "std_msgs/Float64",
        "qos": "0",
        "x": 460,
        "y": 380,
        "wires": [
            [
                "g8d7c0d4.1b0c64"
            ]
        ]
    },
    {
        "id": "g8d7c0d4.1b0c64",
        "type": "debug",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "调试数字消息",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 690,
        "y": 380,
        "wires": []
    },
    {
        "id": "h9d7c0d4.1b0c65",
        "type": "ros2-in",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "位置订阅者",
        "topic": "node_red_position",
        "msgtype": "geometry_msgs/Point",
        "qos": "0",
        "x": 460,
        "y": 440,
        "wires": [
            [
                "i10d7c0d4.1b0c66"
            ]
        ]
    },
    {
        "id": "i10d7c0d4.1b0c66",
        "type": "debug",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "调试位置消息",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 690,
        "y": 440,
        "wires": []
    },
    {
        "id": "e1d8c0d4.1b0c58",
        "type": "comment",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "ROS2 发布节点",
        "info": "",
        "x": 220,
        "y": 60,
        "wires": []
    },
    {
        "id": "f2d8c0d4.1b0c59",
        "type": "comment",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "ROS2 订阅节点",
        "info": "",
        "x": 300,
        "y": 320,
        "wires": []
    },
    {
        "id": "d3e8c0d4.1b0c60",
        "type": "function",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "监控ROS2状态",
        "func": "// 监控所有ROS2节点的状态\nconst rosNodes = flow.get('ros2_nodes') || [];\n\n// 添加新节点\nif (!rosNodes.includes(msg._msgid)) {\n    rosNodes.push({\n        id: msg._msgid,\n        type: msg.type,\n        name: msg.name,\n        status: msg.status\n    });\n    flow.set('ros2_nodes', rosNodes);\n}\n\n// 更新状态\nconst updatedNodes = rosNodes.map(node => {\n    if (node.id === msg._msgid) {\n        return {\n            ...node,\n            status: msg.status\n        };\n    }\n    return node;\n});\nflow.set('ros2_nodes', updatedNodes);\n\n// 创建状态报告\nconst statusReport = {\n    payload: {\n        timestamp: new Date().toISOString(),\n        nodes: updatedNodes\n    }\n};\n\n// 发送到状态面板\nreturn [statusReport, msg];",
        "outputs": 2,
        "timeout": "",
        "noerr": 0,
        "initialize": "",
        "finalize": "",
        "libs": [],
        "x": 460,
        "y": 520,
        "wires": [
            [
                "j11d7c0d4.1b0c67"
            ],
            []
        ]
    },
    {
        "id": "j11d7c0d4.1b0c67",
        "type": "debug",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "ROS2 状态报告",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "payload",
        "targetType": "msg",
        "statusVal": "",
        "statusType": "auto",
        "x": 690,
        "y": 520,
        "wires": []
    },
    {
        "id": "k12d7c0d4.1b0c68",
        "type": "link in",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "状态监控输入",
        "links": [],
        "x": 215,
        "y": 520,
        "wires": [
            [
                "d3e8c0d4.1b0c60"
            ]
        ]
    },
    {
        "id": "f8f54befb1cff61a",
        "type": "ros2-in",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "chatter订阅者",
        "topic": "chatter",
        "msgtype": "std_msgs/String",
        "qos": 0,
        "x": 350,
        "y": 600,
        "wires": [
            [
                "f6a5ed82e4ccba70"
            ]
        ]
    },
    {
        "id": "f6a5ed82e4ccba70",
        "type": "debug",
        "z": "b7f7c0c7d8e1a0e6",
        "name": "debug 1",
        "active": true,
        "tosidebar": true,
        "console": false,
        "tostatus": false,
        "complete": "false",
        "statusVal": "",
        "statusType": "auto",
        "x": 560,
        "y": 600,
        "wires": []
    }
]
```