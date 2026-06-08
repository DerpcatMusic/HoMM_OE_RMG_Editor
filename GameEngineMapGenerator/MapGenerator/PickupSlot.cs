using System;
using UnityEngine;

namespace Hex.MapGenerator
{
	[Serializable]
	public struct PickupSlot
	{
		public Vector2Int position;

		public bool isOptional;

		[HideInInspector]
		public bool canBeHole;
	}
}
