namespace Hex.MapGenerator;

public static class DataHandleExtentions
{
	public static ReadOnlyArray<T> AsReadonly<T>(this T[] array)
	{
		return new ReadOnlyArray<T>(array);
	}
}
