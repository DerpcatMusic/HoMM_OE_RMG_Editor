using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class PlacementRule
	{
		public string type;

		public string[] args;

		public float target;

		public float targetMin;

		public float targetMax;

		public float weight;
	}
}
