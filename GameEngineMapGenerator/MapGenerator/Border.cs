using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class Border
	{
		[Serializable]
		public struct NoiseMode
		{
			public float amp;

			public float freq;
		}

		public float cornerRadius;

		public int obstaclesWidth;

		public NoiseMode[] obstaclesNoise;

		public int waterWidth;

		public NoiseMode[] waterNoise;

		public string waterType;
	}
}
