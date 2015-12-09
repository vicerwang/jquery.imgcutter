# jquery.imgcutter
jquery.imgcutter是浏览器端的图片预览裁剪jquery插件，支持chrome/firefox/ie7+等浏览器，插件本身遵循UMD规范。

## 下载

```
bower install jquery.imgcutter
```

## 使用

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>jquery.imgcutter</title>
    <link rel="stylesheet" href="jquery.imgcutter.css">
    <style>
        #container {
            width: 300px;
            padding-bottom: 30px;
            margin-bottom: 30px;
            border: 1px solid #ddd;
        }
    </style>
</head>
<body>
    <div id="container"></div>
    <input type="file">
    <script src="jquery.js"></script>
    <script src="jquery.imgcutter.js"></script>
    <script>
        $('input[type=file]').imgcutter({
            container: '#container'
        });
    </script>
</body>
</html>

```
插件本身并不含有弹窗功能，请配合其他弹窗插件（如[colorbox](https://github.com/jackmoore/colorbox)等）使用，可参照example中的例子。

```
cd jquery.imgcutter
bower install -dev
```

## 参数
<table>
    <tr>
        <th>参数</th>
        <th>默认值</th>
        <th>描述</th>
    </tr>
    <tr>
        <td>container</td>
        <td>""</td>
        <td>图片预览剪裁区域的容器元素，支持jquery选择器，dom对象以及jquery对象</td>
    </tr>
    <tr>
        <td>previewrWidth</td>
        <td>300</td>
        <td>预览区域的宽度，支持如300以及"300px"</td>
    </tr>
    <tr>
        <td>previewrHeight</td>
        <td>300</td>
        <td>预览区域的高度，支持如300以及"300px"</td>
    </tr>
    <tr>
        <td>selectorWidth</td>
        <td>250</td>
        <td>剪裁区域的宽度，支持如250以及"250px"</td>
    </tr>
    <tr>
        <td>selectorHeight</td>
        <td>250</td>
        <td>剪裁区域的高度，支持如250以及"250px"</td>
    </tr>
    <tr>
        <td>sliderLength</td>
        <td>200</td>
        <td>滑块可滑行的长度，支持如200以及"200px"</td>
    </tr>
    <tr>
        <td>enlargeMax</td>
        <td>2</td>
        <td>放大到剪裁区域的最大倍数</td>
    </tr>
    <tr>
        <td>clickEnlarge</td>
        <td>true</td>
        <td>点击滑块左右时是否进行缩小以及放大</td>
    </tr>
    <tr>
        <td>enlargeRate</td>
        <td>0.1</td>
        <td>每次点击滑块左右时缩小以及放大的倍数，只有在clickEnlarge设置为true时才会起作用</td>
    </tr>
    <tr>
        <td>beforePreview</td>
        <td>null</td>
        <td>在选取文件后预览图片前执行的回调函数，可以在这里对上传文件进行类型检查以及隐藏容器区域的再次显示，如果返回值为false，那么将不会继续预览</td>
    </tr>
</table>

## 方法

* getCutInfo

	获取图片剪裁相关的参数
	
	```javascript
	var cutInfo = $(selector).imgcutter('getCutInfo');
	```
	该方法的返回值结构为
	
	<table>
	    <tr>
	        <td>previewrWidth</td>
	        <td>预览区域的宽度</td>
	    </tr>
	    <tr>
	        <td>previewrHeight</td>
	        <td>预览区域的高度</td>
	    </tr>
	    <tr>
	        <td>selectorWidth</td>
	        <td>剪裁区域的宽度</td>
	    </tr>
	    <tr>
	        <td>selectorHeight</td>
	        <td>剪裁区域的高度</td>
	    </tr>
	    <tr>
	        <td>originalWidth</td>
	        <td>图片实际的宽度</td>
	    </tr>
	    <tr>
	        <td>originalHeight</td>
	        <td>图片实际的高度</td>
	    </tr>
	    <tr>
	        <td>currentWidth</td>
	        <td>图片放大或缩小后的宽度</td>
	    </tr>
	    <tr>
	        <td>currentHeight</td>
	        <td>图片放大或缩小后的高度</td>
	    </tr>
	    <tr>
	        <td>selectorX</td>
	        <td>图片裁剪区域左上角距离图片左上角的x轴距离</td>
	    </tr>
	    <tr>
	        <td>selectorY</td>
	        <td>图片裁剪区域左上角距离图片左上角的y轴距离</td>
	    </tr>
	</table>

* cut
	
	将裁剪区域显示到页面上，支持HTML5 File Api的浏览器会插入图片，ie9及其以下版本会插入经过滤镜处理的显示图片的div
	
	```javascript
	$(selector).imgcutter('cut', previewContainer, height, width);
	```
	参数
	
    <table>
        <tr>
            <td>previewContainer</td>
            <td>裁剪后预览区域，支持jquery选择器，dom对象以及jquery对象</td>
        </tr>
        <tr>
            <td>height</td>
            <td>裁剪后预览区域的高度，支持如150以及"150px"</td>
        </tr>
        <tr>
            <td>width</td>
            <td>裁剪后预览区域的宽度，支持如150以及"150px"</td>
        </tr>
    </table>
    
* destory
	解除绑定的事件，删除添加的html结构
	
	```javascript
	$(selector).imgcutter('destory');
	```