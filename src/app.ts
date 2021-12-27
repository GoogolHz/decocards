/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

import delay from './utils/delay';

// const fs = require('fs').promises;
import fs from 'fs';
import path from 'path';

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
export default class DeckoCards {
	private text: MRE.Actor = null;
	private textb: MRE.Actor = null;
	private kitItemBall1: MRE.Actor = null;
	private ramp: MRE.Actor = null;
	private ramps: MRE.Actor[] = [];

	private assets: MRE.AssetContainer;
	private gltf_test: MRE.Actor = null;
	private gltf_card_asset: MRE.Prefab = null;


	private subPlane: MRE.Actor = null;
	private groundCollider: MRE.Actor = null;

	private model: MRE.Actor = null;
	private materials: MRE.Material[] = [];
	private cardMat1: MRE.Material;
	private cardTex1: MRE.Texture;
	private cardMesh1: MRE.Mesh;


	private spamRoot: MRE.Actor;
  private resetLayer: MRE.CollisionLayer;
	private triggerPlane: MRE.Actor;
	private ballCheckInterval: NodeJS.Timeout;
	// private myStore: window.localStorage;
	/**
	 * From GrabTest Functional test
	 *
	 */

	public expectedResultDescription = "Different grabbable items.";
	private state = 0;
	private clickCount = 0;
	private orbIDs = ['1712660454259557215', '1678828395690984070', '1713205174475948516'];
	private orbNum = this.orbIDs.length;
	private activeBallCount = 0;
	private maxCount = 8;
	private resetCount = 0;
	private allBalls: MRE.Actor[] = [];
	private allBallColliders: MRE.Actor[] = [];
	private filePath = "the.path.to .the.file";
	private spawnLoc = [{x:25, z:25}, {x:10, z:60}, {x:50, z:90}, {x:60, z:40}];
	// public _this = this;

	private readonly SCALE = 0.2;

	public cleanup() {
		clearInterval(this.ballCheckInterval);
		this.assets.unload();
	}


	private spawnActors(count: number, card_back_prefab: MRE.Asset[], card_face_prefab: MRE.Asset[]) {

		const inc  = (Math.PI * 2) / count;

		for (let loc = 0; loc < 1; loc++) {
			for (let i = 0; i < count; i++) {

				let currentOffset = null;

				let mat:MRE.Material = this.assets.createMaterial(`Material${i}`, {
					mainTextureId: this.cardTex1.id,
					// alphaMode: MRE.AlphaMode.Blend
				});


			let card = MRE.Actor.CreateFromPrefab(this.context, {
						// firstPrefabFrom: gltf_card_asset,
						firstPrefabFrom: card_back_prefab,
						actor: {
							name: `card${i}`,
							collider: {
								geometry: {
									shape: MRE.ColliderType.Box,
									size: { x: 0.2219, y: 0.0008, z: 0.323}
								 },
								layer: MRE.CollisionLayer.Default,
								dynamicFriction: .9,
							},
							appearance: {
								enabled: true,
							},
							transform: {
								local: {
									scale: { x:11.5, y: 11.5, z: 11.5 },
									// position: { x: this.spawnLoc[loc].x-Math.cos(i*inc)*(i*.25+10), y: i+1, z: this.spawnLoc[loc].z+Math.sin(i*inc)*(i*.25+10) },
									position: { x: this.spawnLoc[loc].x, y: 100+Math.random()*100, z: this.spawnLoc[loc].z },
									// rotation: MRE.Quaternion.FromEulerAngles( 0 * MRE.DegreesToRadians, (360/i) * MRE.DegreesToRadians, 0 * MRE.DegreesToRadians),
								},
							},
							rigidBody: {
								mass: .01,
							},
						},
					});
					let cardface = MRE.Actor.CreateFromPrefab(this.context, {
						// firstPrefabFrom: gltf_card_asset,
						firstPrefabFrom: card_face_prefab,

						actor: {
							name: `cardface${i}`,
							parentId: card.id,
							// collider: {
							// 	geometry: {
							// 		shape: MRE.ColliderType.Auto,
							// 		// size: {x: 1, y: 0.0005, z: 1}
							// 	},
							// 	layer: MRE.CollisionLayer.Default,
							// 	dynamicFriction: .9,
							// },
							appearance: {
								enabled: true,
								meshId: this.cardMesh1.id,
							},
							transform: {
								local: {
									scale: { x:-0.1695, y: 0.0005, z:0.1695 },
							 		position: { x: 0, y: -.0005, z: 0 },
									rotation: MRE.Quaternion.FromEulerAngles( 180 * MRE.DegreesToRadians, 0 * MRE.DegreesToRadians, 0 * MRE.DegreesToRadians),
								}
							},
						},
					});

					let navlayer =	MRE.Actor.CreatePrimitive( this.assets, {
						definition: { shape: MRE.PrimitiveShape.Box },
						actor: {
							name: `card-nav${i}`,
							parentId: card.id,
							transform: {
								local: {
									position: { x: 0, y: 0, z: 0 },
									// scale: { x: 0.22, y: 0.0002, z: 0.3 },
									scale: { x: 0.2219, y: 0.0006, z: 0.323 },
								}
							},
							collider: {
								geometry: { shape: MRE.ColliderType.Box },
								layer: MRE.CollisionLayer.Navigation,
								dynamicFriction: .9,
							},
							appearance: { enabled: false }
						},
						addCollider: true
					}
				);


				card.created().then(() => {
					card.grabbable = true;
					mat.mainTextureOffset.set( (i%9)/9, 1-(Math.floor((i/count)*6)*.161784) );  //*0.9808
					mat.mainTextureScale.set(1, 1);
					cardface.appearance.materialId = mat.id;
					// if (i==50 || i===50) {
					// 	this.textb.text.contents = `card appearance materialId: \n${ JSON.stringify(card.appearance, null, 2) } \n B` ;
					// }
				});
			}
		}
	}


	constructor(private context: MRE.Context, protected baseUrl: string) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */

	private async started() {

		// set up somewhere to store loaded assets (meshes, textures,
		// animations, gltfs, etc.)

		this.assets = new MRE.AssetContainer(this.context);

		this.groundCollider =  MRE.Actor.CreatePrimitive(this.assets, {
			definition: { shape: MRE.PrimitiveShape.Box },
			actor: {
				name: 'ballTriggerPlane',
				transform: {
					app: { position: { x: 0, y: -2.5, z: 0 } },
					local: { scale: { x: 400, y: 5, z: 400 } }
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Box,
						// size: { x: 400, y: 5, z: 400 }
					},
					// isTrigger: true,
					layer: MRE.CollisionLayer.Navigation
				},
				appearance: { enabled: false }
			},
			addCollider: true
		});


		this.subPlane = MRE.Actor.CreatePrimitive(this.assets, {
			definition: { shape: MRE.PrimitiveShape.Box },
			actor: {
				name: 'ballTriggerPlane',
				transform: {
					app: { position: { x: 0, y: -100, z: 0 } },
					local: { scale: { x: 400, y: 2, z: 400 } }
				},
				collider: {
					geometry: {
						shape: MRE.ColliderType.Box,
						size: { x: 400, y: 2, z: 400 }
					},
					isTrigger: true,
					layer: MRE.CollisionLayer.Default
				}
			},
			addCollider: true
		});

		// let _this = this;
		this.subPlane.created().then(() => {
 			// this.text.text.contents = "Subplane Created";
			this.subPlane.collider.isTrigger = true;
			this.subPlane.collider.onTrigger('trigger-enter', (actor) => this.resetCardonEnter(actor));
			this.subPlane.collider.onTrigger('trigger-exit', (actor) => this.resetCardonExit(actor));
		 });

		// this.text = MRE.Actor.Create(this.context, {
		// 	actor: {
		// 		name: 'Text',
		// 		transform: {
		// 			app: { position: { x: this.spawnLoc[2].x, y: 7, z: this.spawnLoc[2].z },
		// 			rotation: { x: 0, y: 1.5, z: 0 } }
		// 		},
		// 		text: {
		// 			contents: "Hello Dear World!",
		// 			anchor: MRE.TextAnchorLocation.MiddleCenter,
		// 			color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
		// 			height: 0.1
		// 		}
		// 	}
		// });
		//
		// this.textb = MRE.Actor.Create(this.context, {
		// 	actor: {
		// 		name: 'Textb',
		// 		transform: {
		// 			app: { position: { x: this.spawnLoc[2].x+2, y: 7, z: this.spawnLoc[2].z+2 },
		// 			rotation: { x: 0, y: 1.5, z: 0 } }
		// 		},
		// 		text: {
		// 			contents: "Hello Dear World! (B)",
		// 			anchor: MRE.TextAnchorLocation.MiddleCenter,
		// 			color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
		// 			height: 0.1
		// 		}
		// 	}
		// });


//https://cdn-content-ingress.altvr.com/uploads/model/gltf/1828472765229826814/cardspit-back.glb
		// const gltf_card_asset = await this.assets.loadGltf('https://cdn-content-ingress.altvr.com/uploads/model/gltf/1822959189522120833/card.glb', "mesh");
		const gltf_cardback_asset = await this.assets.loadGltf('https://cdn-content-ingress.altvr.com/uploads/model/gltf/1828472765229826814/cardsplit-back.glb');
		const gltf_cardface_asset = await this.assets.loadGltf('https://cdn-content-ingress.altvr.com/uploads/model/gltf/1828473431612457885/cardspit-face.glb');
		// const gltf_cardface_asset = await this.assets.loadGltf('https://cdn-content-ingress.altvr.com/uploads/model/gltf/1828533036254232596/cardsplit-face-abnormal.glb', "mesh");


		this.cardMesh1 = gltf_cardback_asset.find(a => a.mesh !== null).mesh;
		this.cardMat1 = gltf_cardback_asset.find(a => a.material !== null).material;
		this.cardTex1 = gltf_cardback_asset.find(a => a.texture !== null).texture;
		// const animation-part = gltf_cardback_asset.find(a => a.aniamtion !== null).animation;
		//this.text.text.contents = `appearance: \n${ JSON.stringify(gltf_cardface_asset, null, 2) } \n Zim Zam Zoom` ;

		this.spawnActors(54, gltf_cardback_asset, gltf_cardface_asset);

		return true;

		//====================
		// Call an async function to "pulse" the size of the kit item in a loop.
		//====================
		// this.rotateActor(this.kitItemBall1);
	}


	public resetCardonEnter(actor: MRE.Actor) {

		let card =  actor.parent;
		card.rigidBody.angularVelocity = {x:0, y:0, z:1};
		card.transform.app.position.x=35;
	  card.transform.app.position.y=150;
	  card.transform.app.position.z=0;

		// this.reattachCardTrigger(card);
		// this.text.text.contents = `${card.name} entered • balls: ${this.activeBallCount} • resets:${this.resetCount++}`;
	}

	public resetCardonExit(actor: MRE.Actor) {
		let card =  actor.parent;
		// this.text.text.contents = `${card.name} exited • balls: ${this.activeBallCount} • resets:${this.resetCount++}`;
		card.rigidBody.angularVelocity = {x:0, y:0, z:1};
	  card.transform.app.position.x=35;
	  card.transform.app.position.y=150;
	  card.transform.app.position.z=0;
			// this.reattachCardTrigger(card);
	}

	// private reattachCardTrigger(card: MRE.Actor) {
	// 	// make child collider that will trigger the terminus plane
	// 	let collidercardTrigger = MRE.Actor.CreatePrimitive(this.assets, {
	// 		definition: { shape: MRE.PrimitiveShape.Box },
	// 		actor: {
	// 			name: 'triggerbox',
	// 			parentId: card.id,
	// 			transform: {
	// 				local: {
	// 					scale: { x: 0.05, y: 0.05, z: 0.05 },
	// 				}
	// 			},
	// 			collider: { geometry: { shape: MRE.ColliderType.Box } },
	// 			appearance: { enabled: false }
	// 		},
	// 		addCollider: true
	// 	});
	// }
}
