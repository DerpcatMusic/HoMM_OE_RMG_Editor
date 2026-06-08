using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class Orientation
	{
		public string mode;

		public string zeroAngleZone;

		public float baseAngleMin;

		public float baseAngleMax;

		public float randomAngleAmplitude;

		public float randomAngleStep;

		[NonSerialized]
		public int zeroAngleZoneIndex;

		[NonSerialized]
		public GraphOrientationMode modeEnum;
	}
}
