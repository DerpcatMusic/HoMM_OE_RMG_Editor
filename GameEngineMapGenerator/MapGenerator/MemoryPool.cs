using System.Collections.Generic;

namespace Hex.MapGenerator;

public class MemoryPool<T>
{
	private List<T> data;

	public MemoryPool()
	{
		data = new List<T>();
	}

	public MemoryPool(int capacity)
	{
		data = new List<T>(capacity);
	}

	public PooledArray<T> Allocate(int length, T fillValue = default(T))
	{
		int count = data.Count;
		for (int i = 0; i < length; i++)
		{
			data.Add(fillValue);
		}
		return new PooledArray<T>(length, count, data);
	}

	public void Clear()
	{
		data.Clear();
	}
}
