using System;
using UnityEngine;

namespace Hex.MapGenerator
{
	[Serializable]
	public struct BuildingSlot
	{
		public int width;

		public int height;

		public InteractionLayout interaction;

		public Vector2Int position;

		public Vector2Int lyy()
		{
			return default(Vector2Int);
		}

		public Vector2Int lyz()
		{
			return default(Vector2Int);
		}
	}
}
