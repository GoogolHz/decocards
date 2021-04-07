/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import delay from './utils/delay';


//======================================
// Convert a rotation from Unity-style Euler angles to a Quaternion.
// If null or undefined passed in, use a 0 rotation.
//======================================
function Unity2QuaternionRotation(euler: MRE.Vector3Like):
	MRE.Quaternion {
	return euler ? MRE.Quaternion.FromEulerAngles(
		euler.x * MRE.DegreesToRadians,
		euler.y * MRE.DegreesToRadians,
		euler.z * MRE.DegreesToRadians
	) : new MRE.Quaternion();
}

/*
 * sleep() function
 *
 * Returns a Promise that resolves afer 'ms' milliseconds.  To cause your code to pause for that
 * time, use 'await sleep(ms)' in an async function.
 */
function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

/**
 * The main class of this app. All the logic goes here.
 */
export default class MarbleRun {
	private text: MRE.Actor = null;
	private kitItemBall1: MRE.Actor = null;
	private ramp: MRE.Actor = null;
	private ramps: MRE.Actor[] = [];

	private assets: MRE.AssetContainer;
	private subPlane: MRE.Actor = null;

	private model: MRE.Actor = null;
	private materials: MRE.Material[] = [];
	private spamRoot: MRE.Actor;
  private resetLayer: MRE.CollisionLayer;
	private triggerPlane: MRE.Actor;
	private ballCheckInterval: NodeJS.Timeout;
	/**
	 * From GrabTest Functional test
	 *
	 */

	public expectedResultDescription = "Different grabbable items.";
	private state = 0;
	private clickCount = 0;


	// private assets: MRE.AssetContainer;

	private readonly SCALE = 0.2;

	public cleanup() {
		clearInterval(this.ballCheckInterval);
		this.assets.unload();
	}


	private spawnActors(count: number) {
		if (this.spamRoot) {
			this.spamRoot.destroy();
		}

		const ball = this.assets.meshes.find(m => m.name === 'ball')
			|| this.assets.createSphereMesh('ball', 0.05);

		this.spamRoot = MRE.Actor.Create(this.context, {
			actor: {
				name: 'spamRoot',
				transform: { local: { position: { y: 5, z: 0 } } }
			}
		});

		for (let i = 0; i < count; i++) {
			let ramp = MRE.Actor.CreateFromLibrary(this.context, {
				resourceId: 'artifact:1703071908439786046',
				actor: {
					name: `ramp${i}`,

					collider: { geometry: { shape: MRE.ColliderType.Auto } },
					// appearance: {
					// 	// meshId: boxMesh.id,
					// 	materialId: this.materials[Math.floor(Math.random() * this.materials.length)].id
					// },
					transform: {
						local: {
							scale: { x: 0.5, y: 0.5, z: 0.5 },
							position: { x: 2, y: i*.15+3.5, z: -.5 },
							rotation: { x:0, y:3.141, z:0 }
						}
					}
				}
			});
			ramp.created().then(() => ramp.grabbable = true);
		}
	}

	constructor(private context: MRE.Context, protected baseUrl: string) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		const _this = this;
		// set up somewhere to store loaded assets (meshes, textures,
		// animations, gltfs, etc.)
		this.assets = new MRE.AssetContainer(this.context);

		// spawn a copy of a kit item
		this.kitItemBall1 = MRE.Actor.CreateFromLibrary(this.context, {
			resourceId: 'artifact:1678828395690984070',
			actor: {
				name: 'sphere',
				transform: {
					local: {
						scale: { x: 0.75, y: 0.75, z: 0.75 },
						position: { x: 25, y: 40, z: 21 },
						rotation: { x:0, y:0, z:0 }
					}
				},
				rigidBody: {
					mass: 4,
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				subscriptions: ['transform'],
			}
		});

		// this.kitItemBall1.grabbable = true;
		this.kitItemBall1.created().then(() => this.kitItemBall1.grabbable = true);




		// this.spawnActors(25);






		// this.subPlane = MRE.Actor.Create(this.context, {
		// 	actor: {
		// 		name: 'platform',
		// 		transform: {
		// 			local: {
		// 				scale: { x: 0.75, y: 0.75, z: 0.75 },
		// 				position: { x: 0, y: -2, z: 0 }
		// 			}
		// 		},
		// 		appearance: {
		// 			meshId: this.assets.createBoxMesh('platformBox', 1000, 2, 1000).id
		// 		},
		// 		collider: {
		// 			isTrigger: true,
		// 			geometry: { shape: MRE.ColliderType.Auto },
		// 			layer: MRE.CollisionLayer.Navigation }
		// 	}
		// });
		// let _this = this;
		// _this.subPlane.created().then(() => {
		// 	 _this.text.text.contents = "Subplane Created";
		// 	 _this.subPlane.collider.onTrigger('trigger-enter', () => {
		// 		 _this.text.text.contents = "FunkyBall Collided Subplane";
		// 		 _this.kitItemBall1.transform.local.position.x=45;
		// 		 _this.kitItemBall1.transform.local.position.y=40;
		// 		 _this.kitItemBall1.transform.local.position.z=21;
		// 	 });
		//  });

		this.text = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Text',
				transform: {
					app: { position: { x: 0, y: 1.5, z: 0 },
					rotation: { x: 0, y: 1.5, z: 0 } }
				},
				text: {
					contents: "Hello Dear World!",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.3
				}
			}
		});




		// this.triggerPlane = MRE.Actor.CreatePrimitive(this.assets, {
    //   definition: {
		// 		shape: MRE.PrimitiveShape.Box,
    //     // dimensions: { x:1000, y:38, z:1000 },
    //   },
    //   actor: {
		// 		name: 'resetToTop',
    //     // appearance: { enabled: false },
		// 		transform: {
		// 			local: {
		// 				scale: { x: 1000, y: 38, z: 1000 },
		// 				position: { x: 0, y: -40, z: 0 }
		// 			}
		// 		},
		//
    //   },
		// 	addCollider: true,
    // });
		//
		// this.triggerPlane.collider.isTrigger = true;
		//
		// this.triggerPlane.created().then(() => {
		// this.text.text.contents = "Subplane Created";
		//  this.triggerPlane.collider.onTrigger('trigger-enter', (actor) => {
		// 	 _this.text.text.contents = "FunkyBall trigger Enter";
		// 	 actor.transform.local.position.x=25;
		// 	 actor.transform.local.position.y=40;
		// 	 actor.transform.local.position.z=21;
		//  });
		//  this.triggerPlane.collider.onTrigger('trigger-exit', (actor) => {
		// 	_this.text.text.contents = "FunkyBall trigger Exit";
		// 	_this.kitItemBall1.transform.local.position.x=45;
		// 	_this.kitItemBall1.transform.local.position.y=40;
		// 	_this.kitItemBall1.transform.local.position.z=21;
		// });
		//  });

    // this.subPlane.collider.isTrigger = true;
    // this.subPlane.collider.onTrigger('trigger-enter',
    //     (user) => { this.userEnteredSea(user) });
    // this.subPlane.collider.onTrigger('trigger-exit',
    //     (user) => { this.userExitedSea(user) });




		// this.spawnActors(root, 25)
		// this.kitItemBall1.setBehavior(MRE.ButtonBehavior).onClick((user) =>
		// this.changeHorseColor(user));

		// Create an actor
		// this.model = MRE.Actor.CreateFromGltf(this.assets, {
		// 	// from the glTF at the given URL, with box colliders on each mesh
		// 	uri: `${this.baseUrl}/marblerun.glb`,
		// 	colliderType: 'box',
		// 	// Also apply the following generic actor properties.
		// 	actor: {
		// 		name: 'grabby',
		// 		transform: {
		// 			local: {
		// 				scale: { x: this.SCALE, y: this.SCALE, z: this.SCALE },
		// 				position: { x: 0, y: 1, z: -.5 }
		// 			}
		// 		}
		// 	}
		// });





		// Create two grabbable cubes that can be played with at will.  Position left
		// anr right of the monkey.
		// const boxMesh = this.assets.createBoxMesh('box', 0.5, 0.5, 0.5);
		// for (const cube of [{ name: 'Cube1', x: -1 }, { name: 'Cube2', y: 1 }, { name: 'Cube1', y: -1 }, { name: 'Cube2', x: 1 }]) {
		// 	MRE.Actor.Create(this.context, {
		// 		actor: {
		// 			name: cube.name,
		// 			appearance: {
		// 				meshId: boxMesh.id,
		// 				materialId: this.materials[Math.floor(Math.random() * this.materials.length)].id
		// 			},
		// 			collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 			transform: { local: { position: { x: cube.x, y: 0, z: 1 } } }
		// 		}
		// 	}).grabbable = true;
		// }

		this.materials.push(this.assets.createMaterial('mat1',
			{ color: MRE.Color3.FromHexString('#ff0000').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat2',
			{ color: MRE.Color3.FromHexString('#ff7700').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat3',
			{ color: MRE.Color3.FromHexString('#ffbd00').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat4',
			{ color: MRE.Color3.FromHexString('#fcff00').toColor4() }));
		this.materials.push(this.assets.createMaterial('mat5',
			{ color: MRE.Color3.FromHexString('#abf300').toColor4() }));


		// this.assets = new MRE.AssetContainer(this.app.context);

		// MRE.Actor.Create(this.context, {
		// 	actor: {
		// 		name: "Light",
		// 		light: {
		// 			type: 'point',
		// 			range: 5,
		// 			intensity: 2,
		// 			color: { r: 1, g: 0.5, b: 0.3 }
		// 		},
		// 		transform: {
		// 			local: {
		// 				position: { x: -2, y: 2, z: -2 }
		// 			}
		// 		}
		// 	}
		// });

		// Create an actor
		// this.kitItemBall1 = MRE.Actor.CreateFromGltf(this.assets, {
		// 	// from the glTF at the given URL, with box colliders on each mesh
		// 	uri: `${this.baseUrl}/monkey.glb`,
		// 	colliderType: 'box',
		// 	// Also apply the following generic actor properties.
		// 	actor: {
		// 		name: 'clickable',
		// 		parentId: root.id,
		// 		transform: {
		// 			local: {
		// 				scale: { x: this.SCALE, y: this.SCALE, z: this.SCALE },
		// 				position: { x: 0, y: 1, z: -1 }
		// 			}
		// 		}
		// 	}
		// });





		// Create some animations on the cube.

		// this.assets.createAnimationData('OnClick', this.clickAnimationData)
		// 	.bind({ target: this.kitItemBall1 });
		//
		// // Set up cursor interaction. We add the input behavior ButtonBehavior to the cube.
		// // Button behaviors have two pairs of events: hover start/stop, and click start/stop.
		// const behavior = this.kitItemBall1.setBehavior(MRE.ButtonBehavior);
		// behavior.onClick(() => {
		// 	this.state = 3;
		// 	this.text.text.contents = "OnClick";
		// 	this.cycleState();
		// });
		//
		// // Make the actor grabbable and update state based on grab.
		// this.kitItemBall1.grabbable = true;
		// this.kitItemBall1.onGrab('begin', () => {
		// 	this.state = 1;
		// 	this.text.text.contents = "OnGrab begin";
		// 	this.cycleState();
		// });
		// this.kitItemBall1.onGrab('end', () => {
		// 	this.state = 2;
		// 	this.text.text.contents = "OnGrab end";
		// 	this.cycleState();
		// });

		// // Create two grabbable cubes that can be played with at will.  Position left
		// // anr right of the monkey.
		// const boxMesh = this.assets.createBoxMesh('box', 0.5, 0.5, 0.5);
		// for (const cube of [{ name: 'Cube1', x: -1 }, { name: 'Cube2', x: 1 }]) {
		// 	MRE.Actor.Create(this.context, {
		// 		actor: {
		// 			name: cube.name,
		// 			parentId: root.id,
		// 			appearance: {
		// 				meshId: boxMesh.id
		// 			},
		// 			collider: { geometry: { shape: MRE.ColliderType.Auto } },
		// 			transform: { local: { position: { x: cube.x, y: 1, z: -1 } } }
		// 		}
		// 	}).grabbable = true;
		// }

		// this.rotateActor();
		// await this.stoppedAsync();

		// this.kitItemBall1.setBehavior(null);
		// this.app.setOverrideText("Thank you for your cooperation");
		// await delay(1.2 * 1000);


		// _this.ballCheckInterval = setInterval(() => {
		// 	// const modes = [MRE.LookAtMode.TargetXY, MRE.LookAtMode.TargetY, MRE.LookAtMode.None];
		// 	// tester.enableLookAt(lookAtTarget, modes[this.state++ % 3]);
		// 	_this.text.text.contents = "FunkyBall Interval";
		// 	if (_this.kitItemBall1.transform.local.position.y < 0) {
		// 		_this.text.text.contents = "FunkyBall Interval Reset";
		// 		// _this.kitItemBall1.transform.local.position = new Vector3( x: 25, y: 40, z: 21 )
		// 		_this.kitItemBall1.transform.local.position.x = 25;
		// 		_this.kitItemBall1.transform.local.position.y = 40;
		// 		_this.kitItemBall1.transform.local.position.z = 21;
		//
		// 		// { x: 25, y: 40, z: 21 };
		// 	}
		//
		// }, 5000);


		return true;












		//====================
		// Call an async function to "pulse" the size of the kit item in a loop.
		//====================
		// this.rotateActor(this.kitItemBall1);
	}




	// private cycleState() {
	// 	switch (this.state) {
	// 		case 0:
	// 			this.text.text.contents = "cycleState( 0 )";
	// 			// this.app.setOverrideText("Please grab the monkey");
	// 			break;
	// 		case 1:
	// 			this.text.text.contents = "cycleState( 1 )";
	// 			// this.app.setOverrideText("Move the monkey then release grab.");
	// 			break;
	// 		case 2:
	// 			this.text.text.contents = "cycleState( 2 )";
	// 			// this.app.setOverrideText("Please click monkey to turn off grab.");
	// 			break;
	// 		case 3:
	// 			this.text.text.contents = "cycleState( 3 )";
	// 			if (this.clickCount % 2 === 0) {
	//
	// 				this.kitItemBall1.targetingAnimationsByName.get('OnClick').play();
	// 				this.kitItemBall1.grabbable = false;
	// 				// this.app.setOverrideText("Click to make monkey grabbable again.");
	// 			} else {
	// 				this.kitItemBall1.targetingAnimationsByName.get('OnClick').play();
	// 				this.kitItemBall1.grabbable = true;
	// 				this.state = 0;
	// 				this.cycleState();
	// 			}
	// 			this.clickCount++;
	// 			break;
	// 		default:
	// 			throw new Error(`How did we get here? State: ${this.state}`);
	// 	}
	// }

	// private clickAnimationData: MRE.AnimationDataLike = {
	// 	tracks: [{
	// 		target: MRE.ActorPath("target").transform.local.scale,
	// 		keyframes: [{
	// 			time: 0,
	// 			value: { x: this.SCALE, y: this.SCALE, z: this.SCALE }
	// 		}, {
	// 			time: 0.1,
	// 			value: { x: this.SCALE + 0.1, y: this.SCALE + 0.1, z: this.SCALE + 0.1 }
	// 		}, {
	// 			time: 0.2,
	// 			value: { x: this.SCALE, y: this.SCALE, z: this.SCALE }
	// 		}]
	// 	} as MRE.Track<MRE.Vector3>]
	// };


	// ==========================
	// Rotate the actor 30 degrees around the z axis every second.
	//
	// 'async' makes the function run asynchronously from the test of the code.  That means when this function
	// is called, it returns immediately and runs "separately" from the rest of the code.
	//
	// WARNING: NOT PRODUCTION CODE!  This code is for class explanation only.  If you include the function
	// below in your MRE, your app will not exit, even after all users leave.
	// ==========================
	// private async addGrabbable(actor: MRE.Actor) {
	//
	// }


	//==========================
	// Rotate the actor 30 degrees around the z axis every second.
	//
	// 'async' makes the function run asynchronously from the test of the code.  That means when this function
	// is called, it returns immediately and runs "separately" from the rest of the code.
	//
	// WARNING: NOT PRODUCTION CODE!  This code is for class explanation only.  If you include the function
	// below in your MRE, your app will not exit, even after all users leave.
	//==========================
	// private async rotateActor(actor: MRE.Actor) {
	// 	let angle = 0;
	//
	// 	// The for(; ;) syntax below sets up an infinite loop
	// 	for (; ;) {
	// 		// Sleep for 1 seconds.  The "await" makes the function actually wait for the promise returned
	// 		// by 'sleep' to be resolved.
	// 		await sleep(30);
	//
	// 		// Rotate the actor 30 degrees.
	// 		angle += .3;
	// 		actor.transform.local.rotation
	// 			= Unity2QuaternionRotation({ x: 0, y: angle, z: 0 } as MRE.Vector3Like);
	// 	}
	//
	// }
}
