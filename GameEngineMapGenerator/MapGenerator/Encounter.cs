using UnityEngine;

namespace Hex.MapGenerator
{
	public struct Encounter
	{
		public readonly EncounterTemplate template;

		public readonly int position;

		public readonly int entrance;

		public readonly int optionalPickups;

		public readonly int resourcePickups;

		public Encounter(EncounterTemplate template, int tile, Footprint footprint, int optionalPickups, int resourcePickups, Vector2Int mapSize)
		{
			this.template = null;
			position = 0;
			entrance = 0;
			this.optionalPickups = 0;
			this.resourcePickups = 0;
		}
	}
}
