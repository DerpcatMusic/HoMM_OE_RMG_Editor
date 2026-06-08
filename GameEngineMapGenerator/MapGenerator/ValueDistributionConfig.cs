using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ValueDistributionConfig
	{
		public int[] priceBounds;

		public float[] weights;
	}
}
