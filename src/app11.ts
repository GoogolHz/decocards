/*!
 * Button demo.  Creates a button which, when clicked, will seem to change
 * the color of a horse.  Actually makes horses invisible / visible
 * to change the color.
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

	/*
	 * Trigger volume object
	 */
	private triggerVolume: MRE.Actor;

	//===============================
	// A Map to store the userTrackers, associated with each user.
	//===============================
	private userTrackers = new Map<MRE.Guid, MRE.Actor>();

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
						appearance: { enabled: false },
					}
				}
			));
		}

		/*
		 * Create the trigger area.
		 * It will be a simple box primitive.
		 */
		this.triggerVolume = MRE.Actor.CreatePrimitive(this.assets,
			{
				definition: { shape: MRE.PrimitiveShape.Box },
				actor: {
					transform: {
						local: {
							//==============================
							// Make the volume bigger so users can enter it easily.
							//==============================
							scale: { x: 1, y: 2, z: 1 },

							//==============================
							// Move the box away from the horse.
							//==============================
							position: { x: -6.6, y: 0, z: 0 }
						}
					},

					//======================================
					// Keep the box visible this time, so we can see where to enter it.
					//======================================
					appearance: { enabled: true }
				},
				addCollider: true		/* Must have a collider for triggers. */
			}
		);

		/*
		 * Set the collider to be a trigger.
		 * Note: UNDOCUMENTED BEHAVIOR: This must be done *after* the call to
		 * create the actor.
		 */
		this.triggerVolume.collider.isTrigger = true;

		/*
		 * When an Actor enters the trigger volume, change the horse's color
		 */
		this.triggerVolume.collider.onTrigger('trigger-enter', (actor) => this.changeHorseColor());

		//=============================
		// Set up a userJoined() callback to attach userTrackers to the Users.
		//=============================
		this.context.onUserJoined((user) => this.userJoined(user));

		//=============================
		// Set up a userLeft() callback to clean up userTrackers as Users leave.
		//=============================
		this.context.onUserLeft((user) => this.userLeft(user));

		/*
		* Make the first horse visible
		*/
		this.horses[this.activeColor].appearance.enabled = true;
	}

	/*
	* Callback for when the trigger volume is entered
	*/
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

	//====================================
	// userJoined() -- attach a tracker to each user
	//====================================
	private userJoined(user: MRE.User) {
		//================================
		// Create a new tracker and attach it to the user
		//================================
		const tracker = MRE.Actor.CreatePrimitive(this.assets,
			{
				// Make the attachment a small box.
				definition: {
					shape: MRE.PrimitiveShape.Box,
					dimensions: { x: 0.1, y: 0.1, z: 0.1 }
				},

				//========================
				// Make the attachment between the eyes and invisible.
				//========================
				actor: {
					attachment: {
						attachPoint: 'center-eye',
						userId: user.id
					},
					appearance: { enabled: false },

					//========================
					// Need to subscribe to 'transform' so trigger will work for everyone.
					//
					// Without the subscription, the trigger will work for just one person.
					//========================
					subscriptions: ['transform'],
				},

				//========================
				// With attachments like this, we don't need to add a rigidBody 
				// explicitly.
				//========================
				addCollider: true
			}
		);

		/*
		 * Associate the actor with the user in the map.
		 */
		this.userTrackers.set(user.id, tracker);

		/*
		 * Let the syncFix know another user has joined.
		 */
		this.syncFix.userJoined();
	}

	//====================================
	// userLeft() -- clean up tracker as users leave
	//====================================
	private userLeft(user: MRE.User) {
		//================================
		// If the user has a tracker, delete it.
		//================================
		if (this.userTrackers.has(user.id)) {
			const tracker = this.userTrackers.get(user.id);
			tracker.detach();
			tracker.destroy();

			// Remove the entry from the map.
			this.userTrackers.delete(user.id);
		}
	}
}
