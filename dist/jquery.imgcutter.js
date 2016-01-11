(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === "object") {
        module.exports = factory(require('jquery'));
    } else {
        factory(root.$);
    }
}(this, function($) {
    'use strict';

    $.fn.imgcutter = function(opts) {
        if (!$(this).is('input[type=file]')) {
            return;
        }

        var imgCutter = $(this).data('imgcutter');
        if (typeof opts === 'string') {
            if (imgCutter && imgCutter[opts]) {
                return imgCutter[opts].apply(imgCutter, Array.prototype.slice.call(arguments, 1));
            }
            return;
        }
        if (imgCutter) {
            return this;
        }

        var $container;
        if (opts.container) {
            if (opts.container instanceof jQuery) {
                $container = opts.container;
            } else {
                $container = $(opts.container);
            }
            if ($container.length) {
                var imgCutter = new ImgCutter(opts, $container, $(this));
                $(this).data('imgcutter', imgCutter);
                imgCutter.init();
                return this;
            }
        }
    }

    var defaults = {
        container: '',
        previewrWidth: 300,
        previewrHeight: 300,
        selectorWidth: 250,
        selectorHeight: 250,
        sliderLength: 200,
        enlargeMax: 2,
        clickEnlarge: true,
        enlargeRate: 'all',
        beforePreview: null
    }

    function ImgCutter(opts, $container, $input) {
        opts = $.extend(true, {}, defaults, opts);

        this.previewrWidth = parseInt(opts.previewrWidth);
        this.previewrHeight = parseInt(opts.previewrHeight);
        this.selectorWidth = parseInt(opts.selectorWidth);
        this.selectorHeight = parseInt(opts.selectorHeight);
        this.sliderLength = parseInt(opts.sliderLength);
        this.enlargeMax = opts.enlargeMax;
        this.clickEnlarge = opts.clickEnlarge;
        this.enlargeRate = opts.enlargeRate;
        this.beforePreview = opts.beforePreview;

        this.$input = $input;
        this.$container = $container;
        this.$previewr = null;
        this.$inner = null;
        this.$outer = null;
        this.$slider = null;
        this.$sliderHandle = null;
        this.clear();
    }

    $.extend(ImgCutter.prototype, {
        init: function() {
            this.$container.html([
                '<div class="imgcutter-previewr">',
                    '<div class="imgcutter-selector imgcutter-shadow"></div>',
                    '<div class="imgcutter-selector imgcutter-inner"></div>',
                    '<div class="imgcutter-selector imgcutter-outer"></div>',
                '</div>',
                '<div class="imgcutter-slider">',
                    '<span class="imgcutter-slider-reduce"></span>',
                    '<span class="imgcutter-slider-handler"></span>',
                    '<span class="imgcutter-slider-enlarge"></span>',
                '</div>'
            ].join(''));

            this.$previewr = this.$container.children('.imgcutter-previewr').css({
                width: this.previewrWidth,
                height: this.previewrHeight
            });

            this.$previewr.children('.imgcutter-selector').css({
                width: this.selectorWidth,
                height: this.selectorHeight,
                'margin-left': -this.selectorWidth / 2,
                'margin-top': -this.selectorHeight / 2
            });
            this.$inner = this.$previewr.children('.imgcutter-inner');
            this.$outer = this.$previewr.children('.imgcutter-outer');

            this.$slider = this.$container.children('.imgcutter-slider').css({
                width: this.sliderLength,
                'margin-left': (this.previewrWidth - this.sliderLength) / 2
            });
            this.clickEnlarge && this.$slider.css('cursor', 'pointer');
            this.$sliderHandle = this.$slider.children('.imgcutter-slider-handler');

            this.initEvent();
        },

        initEvent: function() {
            var ins = this;

            this.$input.on('change.imgcutter', function(e) {
                ins.preview(e);
            });

            // 防止ie8及以下版本在拖动图片或滑块时选中文本
            this.$container.on('selectstart.imgcutter', function(e) {
                e.preventDefault();
            });

            this.$previewr.on('mousedown.imgcutter', function(e) {
                e.preventDefault();
                var distanceY = e.clientY - parseFloat(ins.$photo.css('top'));
                var distanceX = e.clientX - parseFloat(ins.$photo.css('left'));
                var currentWidth = ins.$photo.width();
                var currentHeight = ins.$photo.height();

                var drag = function(e) {
                    var newLeft = ins.block(ins.selectorWidth - currentWidth, e.clientX - distanceX, 0);
                    var newTop = ins.block(ins.selectorHeight - currentHeight, e.clientY - distanceY, 0);
                    ins.$photo.css({
                        top: newTop,
                        left: newLeft
                    });
                }
                $(document)
                    .on('mousemove', drag)
                    .one('mouseup', function(e) {
                        $(this).off('mousemove', drag);
                    });
            });

            this.$sliderHandle.on('mousedown.imgcutter', function(e) {
                e.preventDefault();
                if (!ins.beginWidth) {
                    return;
                }

                var $handler = $(this);
                var distanceX = e.clientX - parseFloat($handler.css('left'));

                var drag = function(e) {
                    var prevLeft = parseFloat($handler.css('left'));
                    var left = ins.block(0, e.clientX - distanceX, ins.sliderLength);
                    $handler.css('left', left);
                    prevLeft !== left && ins.change(left / ins.sliderLength, left < prevLeft);
                }

                $(document)
                    .on('mousemove', drag)
                    .one('mouseup', function() {
                        $(this).off('mousemove', drag);
                    });
            });

            if (this.clickEnlarge) {
                this.$slider.on('mousedown.imgcutter', function(e) {
                    if (!ins.beginWidth) {
                        return;
                    }
                    if (e.target === ins.$sliderHandle[0]) {
                        return;
                    }

                    var newScale;

                    if (e.clientX < $(this).offset().left ||
                        e.clientX > $(this).offset().left + ins.sliderLength) {
                        return;
                    }

                    var isReduce = e.clientX < ins.$sliderHandle.offset().left;
                    if (ins.enlargeRate === 'all') {
                        newScale = (e.clientX - $(this).offset().left) / ins.sliderLength;
                    } else {
                        var currentScale = parseFloat(ins.$sliderHandle.css('left')) / ins.sliderLength;
                        if (!isReduce) {
                            newScale = Math.min(currentScale + ins.enlargeRate, 1);
                        } else {
                            newScale = Math.max(0, currentScale - ins.enlargeRate);
                        }
                    }
                    ins.$sliderHandle.css('left', ins.sliderLength * newScale);
                    ins.change(newScale, isReduce);
                });
            }
        },

        preview: function(e) {
            var input = this.$input[0];
            var ins = this;
            var val = this.$input.val();
            // ie edge将input[type="file"]的value设置为空时，依然会触发change事件
            if (val === '') {
                return;
            }

            if (document.selection) {
                input.select();
                input.blur();
                if (document.selection.createRange().text === '') {
                    return;
                }
            }

            if (this.beforePreview) {
                var extension = val.substr(val.lastIndexOf('.') + 1);
                if (!this.beforePreview.call(input, e, extension)) {
                    this.$inner && this.$inner.empty();
                    this.$outer && this.$outer.empty();
                    this.clear();
                    return;
                }
            }

            // chrome/firefox/ie10及以上版本可使用HTML5 File API预览图片
            if (input.files && input.files[0]) {
                if (!this.$photos) {
                    var photoHtml = '<img class="imgcutter-photo" />';
                    this.$inner.html(photoHtml);
                    this.$outer.html(photoHtml);
                    this.$photo = this.$previewr.find('.imgcutter-photo');
                }

                var reader = new FileReader();
                reader.onload = function(e) {
                    ins.$photo.prop('src', e.target.result);
                }
                reader.readAsDataURL(input.files[0]);

                this.$photo.on('load', function() {
                    ins.originalWidth = this.naturalWidth;
                    ins.originalHeight = this.naturalHeight;
                    ins.autoSize();
                    $(this).css({
                        width: ins.beginWidth,
                        height: ins.beginHeight,
                        top: -(ins.beginHeight - ins.selectorHeight) / 2,
                        left: -(ins.beginWidth - ins.selectorWidth) / 2
                    });
                });
            } else {
                // ie9及以下版本通过ie支持的滤镜来预览图片
                if (!this.$photos) {
                    var photoHtml = '<div class="imgcutter-photo"></div>';
                    this.$inner.html(photoHtml);
                    this.$outer.html(photoHtml);
                    this.$photo = this.$previewr.find('.imgcutter-photo')
                        // imgcutter-photo-fake用来获取图片的实际大小，如果display为none，则获取不到
                        // 为了防止在获取时整个容器被设置为隐藏，所以将imgcutter-photo-fake append到body中，并且设置位置在可视区域外
                    $('<img class="imgcutter-photo-fake" />')
                        .appendTo($('body'))
                        .css({
                            position: 'absolute',
                            top: -9999,
                            left: 0,
                            filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=image)'
                        });
                }

                input.select();
                input.blur();
                var src = document.selection.createRange().text;
                // 需将imgcutter-photo-fake隐藏再显示，才能清除之前图片的height/width
                var $fakePhoto = $('.imgcutter-photo-fake').hide().show();
                var fakePhoto = $fakePhoto[0];
                fakePhoto.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;
                this.originalWidth = fakePhoto.offsetWidth;
                this.originalHeight = fakePhoto.offsetHeight;
                this.autoSize();
                $fakePhoto.hide();

                this.$photo.css({
                    width: this.beginWidth,
                    height: this.beginHeight,
                    top: -(this.beginHeight - this.selectorHeight) / 2,
                    left: -(this.beginWidth - this.selectorWidth) / 2,
                    filter: 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale,src="' + src + '"'
                });
            }

            this.$sliderHandle.css('left', 0);
        },

        autoSize: function() {
            if (this.originalWidth / this.originalHeight >= this.selectorWidth / this.selectorHeight) {
                this.beginWidth = this.selectorHeight * this.originalWidth / this.originalHeight;
                this.beginHeight = this.selectorHeight;
            } else {
                this.beginHeight = this.selectorWidth * this.originalHeight / this.originalWidth;
                this.beginWidth = this.selectorWidth;
            }
        },

        block: function(min, num, max) {
            return num > max ? max : num < min ? min : num;
        },

        change: function(scale, isReduce) {
            var currentWidth = this.$photo.width();
            var currentHeight = this.$photo.height();
            var currentLeft = parseFloat(this.$photo.css('left'));
            var currentTop = parseFloat(this.$photo.css('top'));

            var newWidth = this.beginWidth * (scale * (this.enlargeMax - 1) + 1);
            var newHeight = this.beginHeight * (scale * (this.enlargeMax - 1) + 1);
            var newLeft = -((-currentLeft + this.selectorWidth / 2) * newWidth / currentWidth - this.selectorWidth / 2);
            newLeft = isReduce ? this.block(this.selectorWidth - newWidth, newLeft, 0) : newLeft;
            var newTop = -((-currentTop + this.selectorHeight / 2) * newHeight / currentHeight - this.selectorHeight / 2);
            newTop = isReduce ? this.block(this.selectorHeight - newHeight, newTop, 0) : newTop;

            this.$photo.css({
                width: newWidth,
                height: newHeight,
                left: newLeft,
                top: newTop
            });
        },

        clear: function() {
            this.$photo = null;
            this.originalWidth = 0;
            this.originalHeight = 0;
            this.beginWidth = 0;
            this.beginHeight = 0;
        },

        getCutInfo: function() {
            return {
                previewrWidth: this.previewrWidth,
                previewrHeight: this.previewrHeight,
                selectorWidth: this.selectorWidth,
                selectorHeight: this.selectorHeight,
                originalWidth: this.originalWidth,
                originalHeight: this.originalHeight,
                currentWidth: this.$photo ? this.$photo.width() : 0,
                currentHeight: this.$photo ? this.$photo.height() : 0,
                selectorX: this.$photo ? Math.abs(parseFloat(this.$photo.css('left'))) : 0,
                selectorY: this.$photo ? Math.abs(parseFloat(this.$photo.css('top'))) : 0
            }
        },

        cut: function(container, width, height) {
            var info = this.getCutInfo();
            if (info.currentWidth === 0) {
                return;
            }

            width = parseFloat(width);
            height = parseFloat(height);
            var scale = Math.max(width / info.selectorWidth, height / info.selectorHeight);
            var newWidth = info.currentWidth * scale;
            var newHeight = info.currentHeight * scale;
            var newX = info.selectorX * scale;
            var newY = info.selectorY * scale;

            var $container = container instanceof jQuery ? container : $(container);
            var positionStyle = $container.css('position');
            if ($.inArray(positionStyle, ['absolute', 'fixed', 'relative']) === -1) {
                $container.css('position', 'relative');
            }
            $container.css({
                width: width,
                height: height,
                overflow: 'hidden'
            });

            var supportFileApi = this.$photo.is('img');
            var $photo = $container.children('.imgcutter-cut-preview');
            if ($photo.length === 0) {
                if (supportFileApi) {
                    $photo = $('<img class="imgcutter-cut-preview" />');
                } else {
                    $photo = $('<div class="imgcutter-cut-preview"></div>');
                }
            }

            if (supportFileApi) {
                $photo[0].src = this.$photo[0].src;
            } else {
                var src = this.$photo[0].filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src;
                $photo.css('filter', 'progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale,src="' + src + '"');
            }
            $photo.appendTo($container).css({
                position: 'absolute',
                top: -newY,
                left: -newX,
                width: newWidth,
                height: newHeight
            });
        },

        destory: function() {
            this.$input.off('change.imgcutter');
            this.$container.off('selectstart.imgcutter');
            this.$previewr.off('mousedown.imgcutter');
            this.$sliderHandle.off('mousedown.imgcutter');
            this.clickEnlarge && this.$slider.off('mousedown.imgcutter');
            this.$input.removeData('imgcutter');
            this.$container.empty();
            $('.imgcutter-photo-fake').remove();
        }
    });
}));
