using System;

namespace Hex.MapGenerator;

public class MapFilterValue<T> : IMapFilter where T : struct, IEquatable<T>
{
	private readonly Func<int, T> getValue;

	private T value;

	public MapFilterValue(T[] map, T value)
	{
		getValue = (int ind) => map[ind];
		this.value = value;
	}

	public MapFilterValue(Func<int, T> getValue, T value)
	{
		this.getValue = getValue;
		this.value = value;
	}

	public bool IsValid(int index)
	{
		return value.Equals(getValue(index));
	}

	public void GrabValue(int index)
	{
		value = getValue(index);
	}

	public void SetValue(T value)
	{
		this.value = value;
	}
}
