namespace Hex
{
	public struct ChecksumData
	{
		public readonly int hash;

		public readonly string debugData;

		public ChecksumData(int hash)
		{
			this.hash = 0;
			debugData = null;
		}

		public ChecksumData(int hash, string debugData)
		{
			this.hash = 0;
			this.debugData = null;
		}
	}
}
