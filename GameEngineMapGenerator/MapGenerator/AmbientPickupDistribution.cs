using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class AmbientPickupDistribution
	{
		public float repulsion;

		public float noise;

		public float roadAttraction;

		public float obstacleAttraction;

		public float[] groupSizeWeights;
	}
}
