using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ResourceFractionDistribution
	{
		public int[] countBounds;

		public float[] fractions;
	}
}
