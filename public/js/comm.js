var show_dialog = function (settings) {
    if (typeof $ == 'undefined') {
        return;
    }

    // 初始化配置
    settings = $.extend({},
            {
                id: "infoModal20140114",
                title: "提醒",
                html: "",
                submit: false,
                submit_text: '确定',
                submit_callback: null,
                cancel: false,
                cancel_text: '取消',
                close: true
            },
    settings);

    var show_html = "";
    show_html += "        <div class=\"modal fade\" id=\"" + settings.id + "\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\" aria-hidden=\"true\" style=\"margin-top: 20rem;\" >";
    show_html += "            <div class=\"modal-dialog\">";
    show_html += "                <div class=\"modal-content\">";
    show_html += "                    <div class=\"modal-header\">";
    if (settings.close) {
        show_html += "                        <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-hidden=\"true\">&times;</button>";
    }
    show_html += "                        <h3 class=\"modal-title\">" + settings.title + "</h3>";
    show_html += "                    </div>";
    show_html += "                    <div class=\"modal-body\">";
    show_html += settings.html;
    show_html += "                    </div>";
    show_html += "                    <div class=\"modal-footer\">";
    if (settings.cancel || settings.submit_callback) {
        show_html += "                        <a href=\"#\" class=\"btn\" data-dismiss=\"modal\" >" + settings.cancel_text + "</a>";
    }
    if (settings.submit || settings.submit_callback) {
        show_html += "                        <a href=\"#\" class=\"btn btn-primary\" id=\"btnok\"  data-loading-text=\"提交中...\">" + settings.submit_text + "</a>";
    }
    show_html += "                    </div>";
    show_html += "                </div>";
    show_html += "            </div>";
    show_html += "        </div>";

    if ($("#" + settings.id + "").length) {
        $("#" + settings.id + "").replaceWith(show_html);
    } else {
        $("body").append(show_html);
    }

    $("#" + settings.id + "").modal('show');
    if (settings.submit_callback) {
        $("#" + settings.id + " a.btn-primary").unbind("click").bind("click",
                function () {
                    if (settings.submit_callback()) {
                        $("#" + settings.id + "").modal('hide');
                    }
                }
        );
    }
}
