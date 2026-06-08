using System;

namespace Hex.MapGenerator
{
	public struct BuildingKey : IEquatable<BuildingKey>
	{
		public readonly int width;

		public readonly int height;

		public readonly InteractionLayout interact;

		public BuildingKey(int width, int height, InteractionLayout interact)
		{
			this.width = 0;
			this.height = 0;
			this.interact = default(InteractionLayout);
		}

		public bool Equals(BuildingKey other)
		{
			return false;
		}

		public override int GetHashCode()
		{
			return 0;
		}
	}
}
