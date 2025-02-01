// clickEffects.js

jQuery(document).ready(function($) {
    var a_idx = 0;
    $("body").click(function(e) {
        var a = ["❤不做咸鱼！❤", "❤拒绝懒惰！❤", "❤你好呀！❤", "❤欢迎！❤", "❤热烈欢迎！❤", "❤想做吃货❤", "❤小汪加油❤", "❤早睡早起❤", "❤向大佬学习❤", "❤扶我起来~❤", "❤come on❤", "❤一直在路上~❤", "❤累了~❤", "❤再趴一会❤", "❤66666❤", "❤高兴的飞起*****❤"];
        var $i = $("<span></span>").text(a[a_idx]);
        a_idx = (a_idx + 1) % a.length;
        var x = e.pageX,
            y = e.pageY;
        $i.css({
            "z-index": 999999999999999999999999999999999999999999999999999999999999999999999,
            "top": y - 20,
            "left": x,
            "position": "absolute",
            "font-weight": "bold",
            "opacity": 1, // 设置不透明
            "color": "rgb(" + ~~(100 + Math.random() * 155) + "," + ~~(100 + Math.random() * 155) + "," + ~~(100 + Math.random() * 155) + ")"        });
        $("body").append($i);
        $i.animate({
            "top": y - 180,
            "opacity": 0
        }, 1500, function() {
            $i.remove();
        });
    });
});
