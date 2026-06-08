using System;
using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapGenerator;

public class PositionPicker
{
	public enum Order
	{
		Ascending = 0,
		Descending = 1
	}

	public enum Metric
	{
		MinSqrDist = 0,
		AverageSqrDist = 1
	}

	private List<Vector2> referencePoints = new List<Vector2>();

	private List<float> sortValues = new List<float>();

	private Comparison<int> distanceCompareFuncAscending;

	private Comparison<int> distanceCompareFuncDescending;

	public PositionPicker()
	{
		distanceCompareFuncAscending = (int a, int b) => sortValues[a].CompareTo(sortValues[b]);
		distanceCompareFuncDescending = (int a, int b) => sortValues[b].CompareTo(sortValues[a]);
	}

	public void SetReferencePoints(Vector2 point)
	{
		referencePoints.Clear();
		referencePoints.Add(point);
	}

	public void SetReferencePoints(List<Vector2> points)
	{
		referencePoints.Clear();
		referencePoints.AddRange(points);
	}

	public void AddReferencePoint(Vector2 point)
	{
		referencePoints.Add(point);
	}

	public int PickBest(List<Vector2> points, Order order, Metric metric)
	{
		int result = 0;
		float num = 0f;
		switch (order)
		{
		case Order.Ascending:
			num = float.MaxValue;
			break;
		case Order.Descending:
			num = float.MinValue;
			break;
		}
		for (int i = 0; i < points.Count; i++)
		{
			float num2 = 0f;
			switch (metric)
			{
			case Metric.MinSqrDist:
				num2 = MinSqrDist(points[i], referencePoints);
				break;
			case Metric.AverageSqrDist:
				num2 = AverageSqrDist(points[i], referencePoints);
				break;
			}
			switch (order)
			{
			case Order.Ascending:
				if (num2 <= num)
				{
					num = num2;
					result = i;
				}
				break;
			case Order.Descending:
				if (num2 >= num)
				{
					num = num2;
					result = i;
				}
				break;
			}
		}
		return result;
	}

	public static void SortBy(List<int> resultOrdering, int count, Comparison<int> comparison)
	{
		resultOrdering.Clear();
		for (int i = 0; i < count; i++)
		{
			resultOrdering.Add(i);
		}
		resultOrdering.Sort(comparison);
	}

	public void SortBy(List<int> resultOrdering, List<Vector2> points, Order order, Metric metric)
	{
		resultOrdering.Clear();
		sortValues.Clear();
		for (int i = 0; i < points.Count; i++)
		{
			resultOrdering.Add(i);
			float item = 0f;
			switch (metric)
			{
			case Metric.MinSqrDist:
				item = MinSqrDist(points[i], referencePoints);
				break;
			case Metric.AverageSqrDist:
				item = AverageSqrDist(points[i], referencePoints);
				break;
			}
			sortValues.Add(item);
		}
		switch (order)
		{
		case Order.Ascending:
			resultOrdering.Sort(distanceCompareFuncAscending);
			break;
		case Order.Descending:
			resultOrdering.Sort(distanceCompareFuncDescending);
			break;
		}
	}

	public static float MinSqrDist(Vector2 center, List<Vector2> refPoints)
	{
		float num = float.MaxValue;
		for (int i = 0; i < refPoints.Count; i++)
		{
			float sqrMagnitude = (center - refPoints[i]).sqrMagnitude;
			if (sqrMagnitude < num)
			{
				num = sqrMagnitude;
			}
		}
		return num;
	}

	public static float AverageSqrDist(Vector2 center, List<Vector2> refPoints)
	{
		float num = 0f;
		for (int i = 0; i < refPoints.Count; i++)
		{
			num += (center - refPoints[i]).sqrMagnitude;
		}
		return num / (float)refPoints.Count;
	}
}
