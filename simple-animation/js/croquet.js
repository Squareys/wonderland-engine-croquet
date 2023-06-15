if (WL_EDITOR) {
    /* Make bundling in Wonderland Editor happy enough such that it is
     * able to parse the components */
    var Croquet = {
        Model: class {
            static register() {}
        },
        View: class {},
        Constants: {},
    };
} else {
    var Croquet = require('@croquet/croquet');
}

export var Croquet;
