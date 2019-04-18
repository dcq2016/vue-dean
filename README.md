## dVue
vue的双向绑定原理及实现

##### 效果图展示
![image](https://github.com/dcq2016/vue-dean/blob/master/images/share.gif)

1.实现一个监听器Observer，用来劫持并监听所有属性，如果有变动的，就通知订阅者。<br>
2.实现一个订阅者Watcher，可以收到属性的变化通知并执行相应的函数，从而更新视图。<br>
3.实现一个解析器Compile，可以扫描和解析每个节点的相关指令，并根据初始化模板数据以及初始化相应的订阅器。<br>

##### 流程图展示
![image](https://github.com/dcq2016/vue-dean/blob/master/images/process.png)