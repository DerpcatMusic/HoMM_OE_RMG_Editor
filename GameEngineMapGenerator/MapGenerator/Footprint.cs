using System;
using UnityEngine;

namespace Hex.MapGenerator
{
	public struct Footprint : IEquatable<Footprint>
	{
		public readonly int width;

		public readonly int height;

		public readonly Vector2Int mountOffset;

		public readonly Vector2Int fitMinMax;

		public readonly Vector2Int lookupIndices;

		public Footprint(int width, int height, Vector2Int mountOffset)
		{
			this.width = 0;
			this.height = 0;
			this.mountOffset = default(Vector2Int);
			fitMinMax = default(Vector2Int);
			lookupIndices = default(Vector2Int);
		}

		public bool Equals(Footprint other)
		{
			return false;
		}

		public override int GetHashCode()
		{
			return 0;
		}
	}
}
