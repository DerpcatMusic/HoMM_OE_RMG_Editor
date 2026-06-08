using UnityEngine;

namespace Hex.MapGenerator
{
	public struct Gate
	{
		public readonly bool isValid;

		public readonly int subzoneFrom;

		public readonly int subzoneTo;

		public readonly byte zoneFrom;

		public readonly byte zoneTo;

		public readonly sbyte elevation;

		public readonly bool isWide;

		public readonly int positionFrom;

		public readonly int positionTo;

		public readonly int guardPosition;

		public readonly int guardZone;

		public readonly bool isRamp;

		public readonly int rampDirection;

		public readonly int rampPosition;

		public readonly int rampWidth;

		public Gate(int subzoneFrom, int subzoneTo, byte zoneFrom, byte zoneTo, int positionFrom, int positionTo, int rampPosition, int rampWidth, sbyte elevation, int preferredGuardZone, Vector2Int mapSize)
		{
			isValid = false;
			this.subzoneFrom = 0;
			this.subzoneTo = 0;
			this.zoneFrom = 0;
			this.zoneTo = 0;
			this.elevation = 0;
			isWide = false;
			this.positionFrom = 0;
			this.positionTo = 0;
			guardPosition = 0;
			guardZone = 0;
			isRamp = false;
			rampDirection = 0;
			this.rampPosition = 0;
			this.rampWidth = 0;
		}

		public Gate(int subzoneFrom, int subzoneTo, byte zoneFrom, byte zoneTo, int positionFrom, int positionTo)
		{
			isValid = false;
			this.subzoneFrom = 0;
			this.subzoneTo = 0;
			this.zoneFrom = 0;
			this.zoneTo = 0;
			elevation = 0;
			isWide = false;
			this.positionFrom = 0;
			this.positionTo = 0;
			guardPosition = 0;
			guardZone = 0;
			isRamp = false;
			rampDirection = 0;
			rampPosition = 0;
			rampWidth = 0;
		}

		public Gate(int subzoneFrom, int subzoneTo, byte zoneFrom, byte zoneTo, int positionFrom, int positionTo, int center)
		{
			isValid = false;
			this.subzoneFrom = 0;
			this.subzoneTo = 0;
			this.zoneFrom = 0;
			this.zoneTo = 0;
			elevation = 0;
			isWide = false;
			this.positionFrom = 0;
			this.positionTo = 0;
			guardPosition = 0;
			guardZone = 0;
			isRamp = false;
			rampDirection = 0;
			rampPosition = 0;
			rampWidth = 0;
		}

		public int mob(Vector2Int a, bool b = false)
		{
			return 0;
		}

		public int moc(Vector2Int a)
		{
			return 0;
		}
	}
}
