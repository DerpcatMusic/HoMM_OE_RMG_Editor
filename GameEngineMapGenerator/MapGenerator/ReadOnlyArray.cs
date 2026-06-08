namespace Hex.MapGenerator
{
	public struct ReadOnlyArray<T>
	{
		private readonly T[] array;

		public int cmmo => 0;

		public T this[int index] => default(T);

		public ReadOnlyArray(T[] array)
		{
			this.array = null;
		}
	}
}
