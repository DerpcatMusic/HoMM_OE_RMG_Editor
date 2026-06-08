namespace Hex.MapGenerator;

public class MapFilterAnd : IMapFilter
{
	public IMapFilter[] filters;

	public MapFilterAnd(params IMapFilter[] filters)
	{
		this.filters = filters;
	}

	public bool IsValid(int index)
	{
		bool flag = true;
		for (int i = 0; i < filters.Length; i++)
		{
			flag &= filters[i].IsValid(index);
		}
		return flag;
	}

	public void GrabValue(int index)
	{
		for (int i = 0; i < filters.Length; i++)
		{
			filters[i].GrabValue(index);
		}
	}
}
