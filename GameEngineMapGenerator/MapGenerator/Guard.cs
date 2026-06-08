namespace Hex.MapGenerator
{
	public struct Guard
	{
		public int position;

		public SquadParams squad;

		public Guard(int position, SquadParams squad)
		{
			this.position = 0;
			this.squad = default(SquadParams);
		}
	}
}
