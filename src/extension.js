const vscode = require("vscode");

const fontManager = require("font-scanner");

// Get all available fonts
const fonts = fontManager.getAvailableFontsSync();
const fontFamilies = [...new Set(fonts.map(font => font.family))];

function activate(context) {
    const provider = vscode.languages.registerCompletionItemProvider(
        { scheme: "file", language: "tkxml" },
        {
            provideCompletionItems(document, position, token, context) {
                const completionItems = [];
                const line = document.lineAt(position).text;
                const cursorOffset = position.character;

                // Extract the portion of the line around the cursor
                const beforeCursor = line.slice(0, cursorOffset);
                const afterCursor = line.slice(cursorOffset);

                // Match the tag or attribute under the cursor
                const tagMatch = beforeCursor.match(/<(\w+)[^>]*$/); // Match an opening tag before the cursor
                const attributeMatch = beforeCursor.match(/(\w+)=["'][^"']*$/); // Match an attribute being edited

                if (attributeMatch) {
                    const currentAttribute = attributeMatch[1];
                    const possibleValues = getAttributeValuesFor(currentAttribute);

                    possibleValues.forEach(value => {
                        const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value);
                        item.insertText = new vscode.SnippetString(`${value}`); // Complete value with closing quote
                        item.documentation = `Possible value for ${currentAttribute} attribute.`;
                        completionItems.push(item);
                    });
                } else if (tagMatch) {
                    const elementName = tagMatch[1];
                    const attributes = getAttributesForElement(elementName);

                    attributes.forEach(attribute => {
                        const item = new vscode.CompletionItem(attribute, vscode.CompletionItemKind.Property);
                        item.insertText = new vscode.SnippetString(`${attribute}="$0"`); // Add placeholder for value
                        item.documentation = new vscode.MarkdownString(
                            `Attribute: ${attribute} for <${elementName}> element.`
                        );

                        item.command = {
                            command: "editor.action.triggerSuggest",
                            title: "Trigger Suggest",
                        };

                        completionItems.push(item);
                    });
                } else {
                    // Provide tag completions (e.g., <frame> and others)
                    const elements = [
                        "frame",
                        "canvas",
                        "menu"
                    ];
                    const selfClosingElements = [
                        "image",
                        "listbox",
                        "label",
                        "checkbutton",
                        "radiobutton",
                        "spinbox",
                        "button",
                        "entry",
                        "combobox",
                        "menuoption",
                        "title",
                        "options",
                        "geometry",
                        "configure"
                    ];

                    elements.forEach(element => {
                        const item = new vscode.CompletionItem(element);
                        item.insertText = new vscode.SnippetString(`${element}>\n   $0\n</${element}`);
                        item.documentation = new vscode.MarkdownString(`Inserts a <${element}> element.`);
                        completionItems.push(item);
                    });

                    selfClosingElements.forEach(element => {
                        const item = new vscode.CompletionItem(element);
                        item.insertText = new vscode.SnippetString(`${element}$0/`);
                        item.documentation = new vscode.MarkdownString(`Inserts a <${element}> element.`);
                        completionItems.push(item);
                    });
                }

                return completionItems;
            },
        },
        "<", // Trigger character for tags
        " ", // Trigger character for attributes (after space or equal sign)
        '"'  // Trigger character for values in attributes
    );

    context.subscriptions.push(provider);
}

function getAttributesForElement(elementName) {
    const attributes = {
        frame: ["background", "bd", "bg", "borderwidth", "class", "colormap", "container",
                "cursor", "height", "highlightbackground", "highlightcolor", "highlightthickness",
                "relief", "takefocus", "visual", "width", "controller", "id"],

        canvas: ["background", "bd", "bg", "borderwidth", "closeenough", "confine", "cursor", "height",
                "highlightbackground", "highlightcolor", "highlightthickness", "insertbackground",
                "insertborderwidth", "insertofftime", "insertontime", "insertwidth", "offset", "relief",
                "scrollregion", "selectbackground", "selectborderwidth", "selectforeground", "state",
                "takefocus", "width", "xscrollcommand", "xscrollincrement", "yscrollcommand", "yscrollincrement",
                "controller", "id"],

        label: ["activebackground", "activeforeground", "anchor", "background", "bitmap", "borderwidth",
                "cursor", "disabledforeground", "font", "foreground", "highlightbackground", "highlightcolor",
                "highlightthickness", "image", "justify", "padx", "pady", "relief", "takefocus", "text",
                "textvariable", "underline", "wraplength", "height", "state", "width", "controller", "id"],

        button: ["activebackground", "activeforeground", "anchor", "background", "bitmap", "borderwidth",
                "command", "compound", "default", "cursor", "disabledforeground", "font", "foreground",
                "height", "highlightbackground", "highlightcolor", "highlightthickness", "image", "justify",
                "overrelief", "padx", "pady", "relief", "repeatdelay", "state", "repeatinterval", "takefocus",
                "text", "textvariable", "underline", "width", "wraplength", "controller", "id"],

        checkbutton: ["activebackground", "activeforeground", "anchor", "background", "bd", "bg", "bitmap",
                "borderwidth", "command", "cursor", "disabledforeground", "fg", "font", "foreground", "height",
                "highlightbackground", "highlightcolor", "highlightthickness", "image", "indicatoron", "justify",
                "offvalue", "onvalue", "padx", "pady", "relief", "selectcolor", "selectimage", "state", "takefocus",
                "text", "textvariable", "underline", "variable", "width", "wraplength", "controller", "id"],

        radiobutton: ["activebackground", "activeforeground", "anchor", "background", "bd", "bg", "bitmap", "borderwidth",
                "command", "cursor", "disabledforeground", "fg", "font", "foreground", "height", "highlightbackground",
                "highlightcolor", "highlightthickness", "image", "indicatoron", "justify", "padx", "pady", "relief",
                "selectcolor", "selectimage", "state", "takefocus", "text", "textvariable", "underline", "value",
                "variable", "width", "wraplength", "controller", "id"],

        spinbox: ["activebackground", "background", "borderwidth", "cursor", "exportselection", "font", "foreground",
            "highlightbackground", "highlightcolor", "highlightthickness", "insertbackground", "insertborderwidth",
            "insertofftime", "insertontime", "insertwidth", "justify", "relief", "repeatdelay", "repeatinterval",
            "selectbackground", "selectborderwidth", "selectforeground", "takefocus", "textvariable", "xscrollcommand",
            "buttonbackground", "buttoncursor", "buttondownrelief", "buttonuprelief", "command", "disabledbackground",
            "disabledforeground", "format", "from_", "invalidcommand", "increment", "readonlybackground", "state", "to",
            "validate", "validatecommand", "values", "width", "wrap", "controller", "id"],

        entry: ["background", "bd", "bg", "borderwidth", "cursor", "exportselection", "fg", "font", "foreground",
            "highlightbackground", "highlightcolor", "highlightthickness", "insertbackground", "insertborderwidth",
            "insertofftime", "insertontime", "insertwidth", "invalidcommand", "invcmd", "justify", "relief",
            "selectbackground", "selectborderwidth", "selectforeground", "show", "state", "takefocus",
            "textvariable", "validate", "validatecommand", "vcmd", "width", "xscrollcommand", "controller", "id"],

        combobox: ["class", "cursor", "style", "takefocus", "exportselection", "justify", "height", "postcommand",
            "state", "textvariable", "values", "width", "controller", "id"],
        
        listbox: ["background", "bd", "bg", "borderwidth", "cursor", "exportselection", "fg", "font", "foreground",
            "height", "highlightbackground", "highlightcolor", "highlightthickness", "relief", "selectbackground",
            "selectborderwidth", "selectforeground", "selectmode", "setgrid", "takefocus", "width", "xscrollcommand",
            "yscrollcommand", "listvariable", "controller", "id"],

        menu: ["activebackground", "activeborderwidth", "activeforeground", "background", "bd", "bg", "borderwidth",
            "cursor", "disabledforeground", "fg", "font", "foreground", "postcommand", "relief", "selectcolor",
            "takefocus", "tearoff", "tearoffcommand", "title", "type"],

        menuoption: ["accelerator", "activebackground", "activeforeground", "background", "bitmap", "columnbreak",
            "command", "compound", "font", "foreground", "controller", "id"],

        image: ["activebackground", "activeforeground", "anchor", "background", "bitmap", "borderwidth",
                "cursor", "disabledforeground", "font", "foreground", "highlightbackground", "highlightcolor",
                "highlightthickness", "image", "justify", "padx", "pady", "relief", "takefocus", "text",
                "textvariable", "underline", "wraplength", "height", "state", "width", "file", "controller", "id"],

        title: ["title"],
        options: [],
        geometry: ["size", "position"],
        configure: ["background", "bd", "bg", "border", "borderwidth", "cursor", "height", "highlightbackground",
            "highlightcolor", "highlightthickness", "menu", "padx", "pady", "relief", "takefocus", "width"]
    };
    return attributes[elementName] || [];
}

function getAttributeValuesFor(attributeName) {
    const attributeValues = {
        anchor: ["n", "e", "s", "w", "ne", "nw", "sw", "nw", "center"],
        expand: ["True", "False"],
        fill: ["none", "x", "y", "both"],
        side: ["top", "bottom", "left", "right"],
        background: ["blue", "red"],
        bg: ["blue", "red"],
        foreground: ["black", "white"],
        fg: ["black", "white"],
        cursor: ["arrow", "based_arrow_down", "based_arrow_up", "boat", "bogosity", "bottom_left_corner", "bottom_right_corner",
            "bottom_side", "bottom_tree", "box_spiral", "center_ptr", "circle", "clock", "coffee_mug", "cross", "cross_reverse",
            "crosshair", "diamond_cross", "dot", "dotbox", "double_arrow", "draft_large", "draft_small", "draped_box", "exchange",
            "fleur", "gobbler", "gumby", "hand1", "hand2", "heart", "icon", "iron_cross", "left_ptr", "left_side", "left_tee",
            "leftbutton", "ll_angle", "lr_angle", "man", "middlebutton", "mouse", "pencil", "pirate", "plus", "question_arrow",
            "right_ptr", "right_side", "right_tee", "rightbutton", "rtl_logo", "sailboat", "sb_down_arrow", "sb_h_double_arrow",
            "sb_left_arrow", "sb_right_arrow", "sb_up_arrow", "sb_v_double_arrow", "shuttle", "sizing", "spider", "spraycan",
            "star", "target", "tcross", "top_left_arrow", "top_left_corner", "top_right_corner", "top_side", "top_tee", "trek",
            "ul_angle", "umbrella", "ur_angle", "watch", "xterm", "x_cursor"],
        relief: ["flat", "raised", "sunken", "groove", "ridge"],
        confine: ["True", "False"],
        state: ["normal", "active", "disabled"],
        bitmap: ["error", "gray75", "gray50", "gray25", "gray12", "hourglass", "info", "questhead", "question", "warning"],
        font: ["bold", "normal", ...fontFamilies],
        justify: ["left", "center", "right"],
        default: ["normal", "active", "disabled"],
        overrelief: ["flat", "raised", "sunken", "groove", "ridge"],
        compound: ["top", "bottom", "left", "right", "center"],
        indicatoron: ["True", "False"], // 0 or 1
        buttoncursor: ["arrow", "based_arrow_down", "based_arrow_up", "boat", "bogosity", "bottom_left_corner", "bottom_right_corner",
            "bottom_side", "bottom_tree", "box_spiral", "center_ptr", "circle", "clock", "coffee_mug", "cross", "cross_reverse",
            "crosshair", "diamond_cross", "dot", "dotbox", "double_arrow", "draft_large", "draft_small", "draped_box", "exchange",
            "fleur", "gobbler", "gumby", "hand1", "hand2", "heart", "icon", "iron_cross", "left_ptr", "left_side", "left_tee",
            "leftbutton", "ll_angle", "lr_angle", "man", "middlebutton", "mouse", "pencil", "pirate", "plus", "question_arrow",
            "right_ptr", "right_side", "right_tee", "rightbutton", "rtl_logo", "sailboat", "sb_down_arrow", "sb_h_double_arrow",
            "sb_left_arrow", "sb_right_arrow", "sb_up_arrow", "sb_v_double_arrow", "shuttle", "sizing", "spider", "spraycan",
            "star", "target", "tcross", "top_left_arrow", "top_left_corner", "top_right_corner", "top_side", "top_tee", "trek",
            "ul_angle", "umbrella", "ur_angle", "watch", "xterm", "x_cursor"],
        buttondownrelief: ["flat", "raised", "sunken", "groove", "ridge"],
        buttonuprelief: ["flat", "raised", "sunken", "groove", "ridge"],
        wrap: ["True", "False"],
        show: ["*"],
        exportselection: ["True", "False"],
        selectmode: ["single", "browse", "multiple", "extended"],
        setgrid: ["True", "False"],
        activatestyle: ["underline", "dotbox", "none"],
        style: ["menubar", "tearoff", "normal"],
        type: ["True", "False"],
        columnbreak: ["True", "False"],
        accelerator: ["^n", "^s"],
        file: ["./"]

        
        // Missing: colormap, class, container, takefocus, visual, scrollregion, image, textvariable, command, indicatoron, variable,
        // selectimage format invalidcommand, validate, validatecommand, invcmd, vcmd, xscrollcommand, yscrollcommand, style, postcommand,
        // values, listvariable, tearoffcommand

    };
    return attributeValues[attributeName] || [];
}

function deactivate() {}

module.exports = {
    activate,
    deactivate,
};

