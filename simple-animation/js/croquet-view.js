import {Component, Property} from '@wonderlandengine/api';
import {CursorTarget} from '@wonderlandengine/components';
import {RootModel, RootView} from './simple-animation.js';
import {Croquet} from './croquet.js';

/**
 * View and Controller Component for a Croquet Model.
 */
export class CroquetView extends Component {
    static TypeName = 'croquet-view';
    /* Properties that are configurable in the editor */
    static Properties = {
        apiKey: Property.string('api-key'),
        appId: Property.string('com.example.app'),
        name: Property.string('unnamed'),
        password: Property.string('secret'),

        sphereMesh: Property.mesh(),
        boxMesh: Property.mesh(),
        material: Property.material(),
    };

    static onRegister(engine) {
        engine.registerComponent(CursorTarget);
    }

    start() {
        Croquet.Session.join({
            apiKey: this.apiKey,
            appId: this.appId,
            name: this.name,
            password: this.password,
            model: RootModel,
            view: RootView,
            viewOptions: this,
        });
    }
}
