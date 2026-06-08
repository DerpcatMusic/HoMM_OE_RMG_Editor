using System.Collections;
using UnityEngine;

namespace Hex.MapGenerator;

public class PairSet
{
	private BitArray data;

	private int elementCount;

	public PairSet(int elementCount)
	{
		this.elementCount = elementCount;
		data = new BitArray(elementCount * elementCount);
	}

	public void Set(Vector2Int pair, bool value)
	{
		Set(pair.x, pair.y, value);
	}

	public bool Get(Vector2Int pair)
	{
		return Get(pair.x, pair.y);
	}

	public void Set(int index0, int index1, bool value)
	{
		int num = ((index0 > index1) ? index1 : index0);
		int num2 = ((index0 > index1) ? index0 : index1);
		data[num * elementCount + num2] = value;
	}

	public bool Get(int index0, int index1)
	{
		int num = ((index0 > index1) ? index1 : index0);
		int num2 = ((index0 > index1) ? index0 : index1);
		return data[num * elementCount + num2];
	}
}
