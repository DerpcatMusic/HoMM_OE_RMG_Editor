using System;

namespace Hex.MapGenerator
{
	public struct ContentKey : IEquatable<ContentKey>
	{
		public string sid;

		public int variantIndex;

		public ContentKey(string sid, int variantIndex)
		{
			this.sid = null;
			this.variantIndex = 0;
		}

		public bool Equals(ContentKey other)
		{
			return false;
		}

		public override int GetHashCode()
		{
			return 0;
		}

		public override string ToString()
		{
			return null;
		}
	}
}
