using System;

namespace Hex.MapGenerator
{
	[Serializable]
	public class ZoneLayoutConfig
	{
		public string name;

		public float obstaclesFill;

		public float obstaclesFillVoid;

		public float lakesFill;

		public int minLakeArea;

		public float elevationClusterScale;

		public ZoneElevationMode[] elevationModes;

		public int roadClusterArea;

		public ResourceFractionDistribution guardedEncounterResourceFractions;

		public AmbientPickupDistribution ambientPickupDistribution;
	}
}
