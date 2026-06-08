using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class WalkablePoints
{
	public struct Iterator
	{
		private WalkablePoints points;

		private int current;

		private int end;

		public Iterator(WalkablePoints points, int startPoint)
		{
			this.points = points;
			current = startPoint;
			end = startPoint + points.lookupOrder.Count;
		}

		public bool Next(out int tile)
		{
			tile = -1;
			if (current >= end)
			{
				return false;
			}
			int index = current % points.lookupOrder.Count;
			tile = points.tiles[points.lookupOrder[index]];
			current++;
			return true;
		}
	}

	private Vector2[] bucketCenterPositions;

	private int[] bucketCenterTiles;

	private int[] tiles;

	private int[] bucketBounds;

	private List<int> lookupOrder;

	private int[] bucketMap;

	public int BucketCount => bucketCenterPositions.Length;

	public int TileCount => tiles.Length;

	public Vector2[] BucketCenterPositions => bucketCenterPositions;

	public int[] BucketCenterTiles => bucketCenterTiles;

	public int[] Tiles => tiles;

	public List<int> LookupOrder => lookupOrder;

	public Iterator GetIterator()
	{
		return new Iterator(this, 0);
	}

	public Iterator GetIteratorRandomStart(System.Random random)
	{
		return new Iterator(this, random.Next(TileCount));
	}

	public void Shuffle(System.Random random)
	{
		lookupOrder.Clear();
		for (int i = 0; i < tiles.Length; i++)
		{
			lookupOrder.Add(i);
		}
		RngUtils.Shuffle(lookupOrder, random);
	}

	public WalkablePoints(int[] bucketMap, ZoneMap zoneMap, byte zoneID, List<int> bucketCenterTiles, Vector2Int mapSize)
	{
		this.bucketMap = bucketMap;
		int count = bucketCenterTiles.Count;
		this.bucketCenterTiles = bucketCenterTiles.ToArray();
		bucketCenterPositions = new Vector2[count];
		for (int i = 0; i < count; i++)
		{
			bucketCenterPositions[i] = GridUtils.IndexToPosition(bucketCenterTiles[i], mapSize);
		}
		List<Vector2Int> list = new List<Vector2Int>(count * 10);
		for (int j = 0; j < bucketMap.Length; j++)
		{
			int num = bucketMap[j];
			if (num >= 0 && zoneMap[j] == zoneID)
			{
				list.Add(new Vector2Int(j, num));
			}
		}
		list.Sort((Vector2Int a, Vector2Int b) => a.y.CompareTo(b.y));
		int count2 = list.Count;
		tiles = new int[count2];
		bucketBounds = new int[count + 1];
		bucketBounds[count] = count2;
		int num2 = 0;
		for (int num3 = 0; num3 < count2; num3++)
		{
			tiles[num3] = list[num3].x;
			int y = list[num3].y;
			if (num2 != y)
			{
				for (int num4 = num2 + 1; num4 <= y; num4++)
				{
					bucketBounds[num4] = num3;
				}
				num2 = y;
			}
		}
		lookupOrder = new List<int>(count2);
	}

	public int BucketBegin(int bucketIndex)
	{
		return bucketBounds[bucketIndex];
	}

	public int BucketEnd(int bucketIndex)
	{
		return bucketBounds[bucketIndex + 1];
	}

	public int[] DebugInfo()
	{
		return bucketMap;
	}
}
