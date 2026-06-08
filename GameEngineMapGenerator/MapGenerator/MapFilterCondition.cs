using System;

namespace Hex.MapGenerator;

public class MapFilterCondition : IMapFilter
{
	public readonly Func<int, bool> condition;

	private bool flip;

	public MapFilterCondition(Func<int, bool> condition)
	{
		this.condition = condition;
	}

	public bool IsValid(int index)
	{
		return flip ^ condition(index);
	}

	public void GrabValue(int index)
	{
		flip = !condition(index);
	}
}
