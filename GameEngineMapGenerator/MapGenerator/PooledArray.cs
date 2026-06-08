using System.Collections.Generic;

namespace Hex.MapGenerator
{
	public struct PooledArray<T>
	{
		public readonly int Length;

		private readonly int offset;

		private readonly List<T> data;

		public T this[int index]
		{
			get
			{
				return default(T);
			}
			set
			{
			}
		}

		public PooledArray(int length, int offset, List<T> data)
		{
			Length = 0;
			this.offset = 0;
			this.data = null;
		}
	}
}
