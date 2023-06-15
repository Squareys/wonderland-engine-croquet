import {Croquet} from './croquet.js';
import {hslToRgb} from './utils.js';

/**
 * Copyright 2019-2023 Croquet Studios
 * Copyright 2023 Jonathan Hale
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//------------ Models--------------
// Models must NEVER use global variables.
// Instead use the Croquet.Constants object.

const Q = Croquet.Constants;
Q.BALL_NUM = 50; // how many balls do we want?
Q.STEP_MS = 1000 / 30; // bouncing ball tick interval in ms
Q.SPEED = 0.05; // max speed on a dimension, in units/s

export class RootModel extends Croquet.Model {
    children = [];

    init(options) {
        super.init(options);
        for (let i = 0; i < Q.BALL_NUM; i++) this.add(BallModel.create());
        this.add(
            BallModel.create({
                type: 'box',
                pos: [5, 5, 5],
                color: [1, 1, 1, 1],
                ignoreTouch: true,
            })
        );
    }

    add(child) {
        this.children.push(child);
        this.publish(this.id, 'child-added', child);
    }
}

RootModel.register('RootModel');

class BallModel extends Croquet.Model {
    init(options = {}) {
        super.init();
        const r = (max) => Math.floor(max * this.random()); // return a random integer below max
        this.allowTouch = !options.ignoreTouch;
        this.type = options.type || 'sphere';
        this.color = options.color || hslToRgb(r(360), (r(50) + 50) / 100, 50);
        this.pos = options.pos || [r(10), r(10), r(10)];
        this.speed = this.randomSpeed();
        this.subscribe(this.id, 'touch-me', this.startStop);
        this.alive = options.ignoreTouch || r(100) > 20; // arrange for roughly 1 in 5 balls to start as stationary.
        this.future(Q.STEP_MS).step();
    }

    moveTo(pos) {
        const [x, y, z] = pos;
        this.pos[0] = Math.max(0, Math.min(10, x));
        this.pos[1] = Math.max(0, Math.min(10, y));
        this.pos[2] = Math.max(0, Math.min(10, z));
        this.publish(this.id, 'pos-changed', this.pos);
    }

    randomSpeed() {
        const xs = this.random() * 2 - 1;
        const ys = this.random() * 2 - 1;
        const zs = this.random() * 2 - 1;
        const speedScale = Q.SPEED / Math.sqrt(xs * xs + ys * ys + zs * zs);
        return [xs * speedScale, ys * speedScale, zs * speedScale];
    }

    moveBounce() {
        const [x, y, z] = this.pos;
        if (x <= 0 || x >= 10 || y <= 0 || y >= 10 || z <= 0 || z >= 10)
            this.speed = this.randomSpeed();
        this.moveTo([x + this.speed[0], y + this.speed[1], z + this.speed[2]]);
    }

    startStop() {
        if (this.allowTouch) this.alive = !this.alive;
    }

    step() {
        if (this.alive) this.moveBounce();
        this.future(Q.STEP_MS).step();
    }
}

BallModel.register('Ball');

//------------ View--------------
export class RootView extends Croquet.View {
    constructor(model, params) {
        super(model);

        this.model = model;
        this.params = params;
        this.engine = this.params.engine;

        this.ballViews = [];

        this.model.children.forEach((child) => {
            this.ballViews.push(new BallView(child, this.params));
        });
    }

    detach() {
        this.ballViews.forEach((v) => v.detach());
        this.ballViews.length = 0;
        super.detach();
    }
}

export class BallView extends Croquet.View {
    constructor(model, params) {
        super(model);
        this.engine = params.engine;

        /* Spawn an object for this ball */
        this.object = this.engine.scene.addObject(params.object);

        /* Attach a mesh */
        const m = this.object.addComponent('mesh', {
            mesh: model.type == 'sphere' ? params.sphereMesh : params.boxMesh,
            material: params.material.clone(),
        });

        /* Make the ball clickable/touchable */
        this.object.addComponent('collision', {
            group: 1 << 0 /* group 0 */,
            extents: [0.2, 0.2, 0.2],
        });
        const t = this.object.addComponent('cursor-target');
        t.onClick.add(() => {
            this.publish(model.id, 'touch-me');
        });

        /* Scale and color the ball */
        this.object.name = model.id;
        this.object.scale([0.2, 0.2, 0.2]);
        m.material.diffuseColor = model.color;

        /* Initialize position */
        this.move(model.pos);
        this.subscribe(
            model.id,
            {
                event: 'pos-changed',
                handling: 'oncePerFrame',
            },
            this.move
        );
    }

    move(pos) {
        this.object.setPositionLocal(pos);
    }

    detach() {
        this.object.destroy();
        super.detach();
    }
}
