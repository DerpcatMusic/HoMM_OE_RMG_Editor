using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator
{
	[Serializable]
	public class EncounterTemplate
	{
		public enum TileContent
		{
			Free = 0,
			Obstacle = 1,
			MaybeObstacle = 2,
			Building = 3,
			Guard = 4,
			Pickup = 5
		}

		public enum RoadTargetType
		{
			Entrance = 0,
			Coord = 1
		}

		public string name;

		public EncounterTemplateType encounterType;

		public float relativeFrequency;

		public bool allowMirrorX;

		public bool allowMirrorY;

		public int width;

		public int height;

		public RoadTargetType roadTargetType;

		public Vector2Int roadTarget;

		public GuardSlot[] guards;

		public BuildingSlot[] buildings;

		public PickupSlot[] pickups;

		public List<Vector2Int> entrances;

		public List<Vector2Int> holeTiles;

		public TileContent[] tileContents;
	}
}
