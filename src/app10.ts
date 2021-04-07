/*!
 * Trigger volume demo.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

/*
 * import sync-fix
 */
import { UserSyncFix } from './sync-fix'

/**
 * The main class of this app. All the logic goes here.
 */
export default class HelloWorld {
	/*
	 * Declare a SyncFix object
	 * Set to refresh every 5000 ms (5 sec)
	 */
	private syncFix = new UserSyncFix(5000);

	private assets: MRE.AssetContainer;

	/*
	* Horse IDs and array to hold th horses.
	*/
	private horseIds = ['1637200022015574190', '1633683299916317492', '1633683306996302647',
		'1633683292836332334', '1633683314076287804'];
	private horses = new Array<MRE.Actor>();

	//========================
	// Trigger volume object
	//========================
	private triggerVolume: MRE.Actor;

	//========================
	// An Actor to interface with the trigger volume
	//========================
	private apple: MRE.Actor;

	/*
	* Keep track of the currently visible actor in the array
	*/
	private activeColor = 0;

	/*
	 * constructor
	 */
	constructor(private context: MRE.Context) {
		this.context.onStarted(() => this.started());
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		/*
		* set up somewhere to store loaded assets (meshes, textures,
		* animations, gltfs, etc.)
		*/
		this.assets = new MRE.AssetContainer(this.context);

		/*
		* Loop through all the horse IDs, and create invisible horses.
		*/
		for (const horseId of this.horseIds) {
			this.horses.push(MRE.Actor.CreateFromLibrary(this.context,
				{
					resourceId: `artifact:${horseId}`,
					actor: {
						appearance: { enabled: false }
					}
				}
			));
		}

		//============================
		// Create the trigger area.
		// It will be a simple box primitive.
		//============================
		this.triggerVolume = MRE.Actor.CreatePrimitive(this.assets,
			{
				definition: { shape: MRE.PrimitiveShape.Box },
				actor: {
					transform: {
						local: {
							scale: { x: 0.5, y: 1, z: 1.75 }
						}
					},
					appearance: { enabled: false }
				},
				addCollider: true		/* Must have a collider for triggers. */
			}
		);

		//============================
		// Set the collider to be a trigger.
		// Note: UNDOCUMENTED BEHAVIOR: This must be done *after* the call to
		// create the actor.
		//============================
		this.triggerVolume.collider.isTrigger = true;

		//============================
		// When an Actor enters the trigger volume, change the horse's color
		//============================
		this.triggerVolume.collider.onTrigger('trigger-enter', (actor) => this.changeHorseColor());

		//============================
		// Create an Actor to interface with the trigger volume.  Make the Actor
		// grabbable.
		//============================
		this.apple = MRE.Actor.CreateFromLibrary(this.context,
			{
				resourceId: 'artifact:1703285890605907986',
				actor: {
					transform: {
						local: {
							position: { x: -1.5, y: 0, z: 0 }
						}
					},
					grabbable: true,
					//==============================
					// Note: UNDOCUMENTED BEHAVIOR
					// The Actor must have a rigidBody to cause the trigger.
					//
					// It must also have a collider, and adding a rigidBody in the MRE
					// call seems to disable the collider provided by the kit object.
					//
					// Define both in the call.
					//==============================
					rigidBody: {
						useGravity: false	// Don't let the actor fall when released.
					},
					collider: {
						geometry: {
							shape: MRE.ColliderType.Box,
							size: { x: 0.1, y: 0.1, z: 0.1 }
						}
					},

					//==============================
					// Need to subscribe to transforms for triggers
					// to work for all users interactions.
					//==============================
					subscriptions: ['transform']
				}
			});

		/*
		 * Need to let syncFix know when users join
		 */
		this.context.onUserJoined((user) => this.syncFix.userJoined());

		/*
		* Make the first horse visible
		*/
		this.horses[this.activeColor].appearance.enabled = true;
	}

	/*
	* Callback for when the trigger volume is entered
	*/
	//=====================
	// Removed unused MRE.User parameter.  For this example, it would have needed to
	// be an MRE.Actor.
	//=====================
	private changeHorseColor() {
		/* Make the currently visible horse invisible. */
		this.horses[this.activeColor].appearance.enabled = false;

		/*
		* Calculate the next horse to make visible
		* Use modulo arithmetic to force a wraparound
		*/
		this.activeColor = ++this.activeColor % this.horses.length;

		/* Make the new active horse visible. */
		this.horses[this.activeColor].appearance.enabled = true;
	}
}
