using System;
using UnityEngine;

namespace Hex.MapGenerator;

public static class ZoneGraph
{
	public struct ForceCoefficients
	{
		public readonly float attraction;

		public readonly float stiffness;

		public readonly float repulsion;

		public readonly float centerAttraction;

		public readonly bool square;

		public ForceCoefficients(float attraction, float stiffness, float repulsion, float centerAttraction, bool square = false)
		{
			this.attraction = attraction;
			this.stiffness = stiffness;
			this.repulsion = repulsion;
			this.centerAttraction = centerAttraction;
			this.square = square;
		}
	}

	public static (Vector2[] positions, float sizeScale) EmbedGraph(System.Random random, PairSet edges, float[,] edgeLenths, float[] sizes, Orientation orientation)
	{
		Vector2[] array = new Vector2[sizes.Length];
		TryPlaceAndPickBest(random, edges, array, edgeLenths, sizes, orientation.modeEnum == GraphOrientationMode.MinimalBoundingSquare);
		if (orientation.modeEnum == GraphOrientationMode.BoundingCircle)
		{
			RotateByOrientation(array, sizes, random, orientation);
		}
		float item = MapToUnitSquare(orientation.modeEnum, random, array, sizes);
		return (positions: array, sizeScale: item);
	}

	private static void TryPlaceAndPickBest(System.Random random, PairSet edges, Vector2[] positions, float[,] edgeLenths, float[] relativeSizes, bool square)
	{
		float num = float.MaxValue;
		Vector2[] array = new Vector2[positions.Length];
		Vector2[] forces = new Vector2[positions.Length];
		for (int i = 0; i < 10; i++)
		{
			for (int j = 0; j < positions.Length; j++)
			{
				float x = ((float)random.NextDouble() - 0.5f) * 20f;
				float y = ((float)random.NextDouble() - 0.5f) * 20f;
				positions[j] = new Vector2(x, y);
			}
			float num2 = TryPlace(forces, edges, positions, edgeLenths, relativeSizes, square);
			if (num2 < num)
			{
				num = num2;
				for (int k = 0; k < positions.Length; k++)
				{
					array[k] = positions[k];
				}
			}
		}
		for (int l = 0; l < positions.Length; l++)
		{
			positions[l] = array[l];
		}
	}

	private static float TryPlace(Vector2[] forces, PairSet edges, Vector2[] positions, float[,] edgeLenths, float[] radii, bool square)
	{
		for (int i = 0; i < 100; i++)
		{
			ApplyForces(forces, edges, positions, edgeLenths, radii, 0.1f, new ForceCoefficients(1f, 0f, 1f, 0f));
		}
		for (int j = 0; j < 100; j++)
		{
			ApplyForces(forces, edges, positions, edgeLenths, radii, 0.1f, new ForceCoefficients(1f, 1f, 1f, 0f));
		}
		for (int k = 0; k < 100; k++)
		{
			ApplyForces(forces, edges, positions, edgeLenths, radii, 0.1f, new ForceCoefficients(1f, 0f, 1f, 0f));
		}
		for (int l = 0; l < 100; l++)
		{
			ApplyForces(forces, edges, positions, edgeLenths, radii, 0.1f, new ForceCoefficients(1f, 1f, 1f, 0f));
		}
		for (int m = 0; m < 100; m++)
		{
			ApplyForces(forces, edges, positions, edgeLenths, radii, 0.05f, new ForceCoefficients(1f, 10f, 0f, 0.5f));
		}
		return CostFunction(edges, positions, edgeLenths, radii);
	}

	private static void ApplyForces(Vector2[] forces, PairSet edges, Vector2[] positions, float[,] edgeLenths, float[] radii, float delta, ForceCoefficients coeffs)
	{
		Vector2 vector = ComputeCenterOfMass(positions, radii);
		for (int i = 0; i < positions.Length; i++)
		{
			if (coeffs.square)
			{
				Vector2 vector2 = vector - positions[i];
				if (Mathf.Abs(vector2.x) > Mathf.Abs(vector2.y))
				{
					forces[i] = Vector2.right * vector2.x * coeffs.centerAttraction;
				}
				else
				{
					forces[i] = Vector2.up * vector2.y * coeffs.centerAttraction;
				}
			}
			else
			{
				forces[i] = (vector - positions[i]) * coeffs.centerAttraction;
			}
		}
		for (int j = 0; j < positions.Length; j++)
		{
			for (int k = 0; k < j; k++)
			{
				Vector2 vector3 = positions[j] - positions[k];
				float magnitude = vector3.magnitude;
				float num = 1f / magnitude;
				vector3 *= num;
				float num2 = 0f;
				bool num3 = edges.Get(j, k);
				float num4 = edgeLenths[j, k];
				num2 += coeffs.stiffness * Mathf.Max(0f, num4 - magnitude);
				if (num3)
				{
					num2 -= coeffs.attraction * Mathf.Max(0f, magnitude - num4);
				}
				if (!num3)
				{
					num2 += coeffs.repulsion * Mathf.Min(1f, num / num4);
				}
				forces[j] += num2 * vector3;
				forces[k] += (0f - num2) * vector3;
			}
		}
		for (int l = 0; l < positions.Length; l++)
		{
			positions[l] += forces[l] * delta;
		}
	}

	private static float CostFunction(PairSet edges, Vector2[] positions, float[,] edgeLenths, float[] radii)
	{
		float num = 0f;
		for (int i = 0; i < positions.Length; i++)
		{
			for (int j = 0; j < i; j++)
			{
				bool num2 = edges.Get(i, j);
				float magnitude = (positions[i] - positions[j]).magnitude;
				float num3 = edgeLenths[i, j];
				float num4 = 1f / num3;
				num += Mathf.Max(0f, num3 - magnitude) * num4 * 20f;
				if (num2)
				{
					num += Mathf.Max(0f, magnitude - num3) * num4;
				}
			}
		}
		return num / (float)positions.Length;
	}

	private static float MapToUnitSquare(GraphOrientationMode mode, System.Random random, Vector2[] positions, float[] radii)
	{
		switch (mode)
		{
		case GraphOrientationMode.BoundingCircle:
		{
			(Vector2, float) boundingCircle = GetBoundingCircle(positions, radii, 0.5f);
			float result = 1f / (2f * boundingCircle.Item2);
			for (int j = 0; j < positions.Length; j++)
			{
				positions[j] -= boundingCircle.Item1;
				positions[j] /= 2f * boundingCircle.Item2;
				positions[j] += Vector2.one * 0.5f;
			}
			return result;
		}
		case GraphOrientationMode.MinimalBoundingSquare:
		{
			Rect rect = RotateForSmallestAABB(positions, radii, 0.5f);
			Vector2 scale = new Vector2(1f / rect.width, 1f / rect.height);
			for (int i = 0; i < positions.Length; i++)
			{
				positions[i] -= rect.center;
				positions[i].Scale(scale);
				positions[i] += Vector2.one * 0.5f;
			}
			return 1f / Mathf.Max(rect.width, rect.height);
		}
		default:
			return 1f;
		}
	}

	private static void RotateByOrientation(Vector2[] positions, float[] radii, System.Random random, Orientation orientation)
	{
		if (orientation.zeroAngleZoneIndex == -1)
		{
			return;
		}
		Vector2 vector = ComputeCenterOfMass(positions, radii);
		Vector2 vector2 = positions[orientation.zeroAngleZoneIndex] - vector;
		if (vector2.sqrMagnitude != 0f)
		{
			vector2 = vector2.normalized;
			float num = Mathf.Atan2(vector2.y, vector2.x) * 57.29578f;
			float floatInRage = RngUtils.GetFloatInRage(orientation.baseAngleMin, orientation.baseAngleMax, random);
			float num2 = (float)random.NextDouble() * orientation.randomAngleAmplitude;
			if (orientation.randomAngleStep > 0f)
			{
				num2 = (float)Mathf.RoundToInt(num2 / orientation.randomAngleStep) * orientation.randomAngleStep;
			}
			num2 *= (float)((random.Next(2) == 0) ? 1 : (-1));
			RotatePositions(positions, positions, floatInRage + num2 - num);
		}
	}

	private static Rect RotateForSmallestAABB(Vector2[] positions, float[] radii, float radiusScale)
	{
		Vector2[] array = new Vector2[positions.Length];
		float num = float.MaxValue;
		float angle = 0f;
		for (int i = 0; i < 180; i++)
		{
			float num2 = (float)i / 180f * 360f;
			RotatePositions(array, positions, num2);
			Rect aABB = GetAABB(array, radii, radiusScale);
			float num3 = aABB.width * aABB.height;
			if (num3 < num)
			{
				num = num3;
				angle = num2;
			}
		}
		RotatePositions(positions, positions, angle);
		Rect aABB2 = GetAABB(positions, radii, radiusScale);
		for (int j = 0; j < positions.Length; j++)
		{
			positions[j] -= aABB2.center;
		}
		aABB2.position -= aABB2.center;
		return aABB2;
	}

	private static void RotatePositions(Vector2[] dst, Vector2[] src, float angle)
	{
		Quaternion quaternion = Quaternion.AngleAxis(angle, Vector3.forward);
		for (int i = 0; i < src.Length; i++)
		{
			dst[i] = quaternion * src[i];
		}
	}

	private static Vector2 ComputeCenterOfMass(Vector2[] positions, float[] radii)
	{
		Vector2 zero = Vector2.zero;
		float num = 0f;
		for (int i = 0; i < positions.Length; i++)
		{
			float num2 = radii[i] * radii[i];
			num += num2;
			zero += positions[i] * num2;
		}
		return zero / num;
	}

	private static Rect GetAABB(Vector2[] positions, float[] radii, float radiusScale)
	{
		Rect result = new Rect
		{
			xMin = 1000f,
			xMax = -1000f,
			yMin = 1000f,
			yMax = -1000f
		};
		for (int i = 0; i < positions.Length; i++)
		{
			result.xMin = Mathf.Min(result.xMin, positions[i].x - radii[i] * radiusScale);
			result.yMin = Mathf.Min(result.yMin, positions[i].y - radii[i] * radiusScale);
			result.xMax = Mathf.Max(result.xMax, positions[i].x + radii[i] * radiusScale);
			result.yMax = Mathf.Max(result.yMax, positions[i].y + radii[i] * radiusScale);
		}
		return result;
	}

	private static (Vector2 center, float radius) GetBoundingCircle(Vector2[] positions, float[] radii, float radiusScale)
	{
		Vector2 vector = ComputeCenterOfMass(positions, radii);
		float num = 0f;
		for (int i = 0; i < positions.Length; i++)
		{
			float num2 = (vector - positions[i]).magnitude + radii[i] * radiusScale;
			if (num2 > num)
			{
				num = num2;
			}
		}
		return (center: vector, radius: num);
	}

	private static (Vector2 center, float radius) GetBoundingCircleRitter(Vector2[] positions, float[] radii)
	{
		int num = FurthermostCircle(0, positions, radii);
		int num2 = FurthermostCircle(num, positions, radii);
		(Vector2 center, float radius) tuple = CombineBoundingCircles(positions[num], radii[num], positions[num2], radii[num2]);
		Vector2 item = tuple.center;
		float item2 = tuple.radius;
		for (int i = 0; i < positions.Length; i++)
		{
			(Vector2 center, float radius) tuple2 = CombineBoundingCircles(item, item2, positions[i], radii[i]);
			item = tuple2.center;
			item2 = tuple2.radius;
		}
		return (center: item, radius: item2);
	}

	private static (Vector2 center, float radius) CombineBoundingCircles(Vector2 posA, float rA, Vector2 posB, float rB)
	{
		float magnitude = (posA - posB).magnitude;
		if (magnitude <= rA - rB)
		{
			return (center: posA, radius: rA);
		}
		if (magnitude <= rB - rA)
		{
			return (center: posB, radius: rB);
		}
		Vector2 normalized = (posA - posB).normalized;
		float num = (magnitude + rA + rB) * 0.5f;
		return (center: posB + normalized * (num - rB), radius: num);
	}

	private static int FurthermostCircle(int x, Vector2[] positions, float[] radii)
	{
		int result = x;
		float num = 0f;
		for (int i = 0; i < positions.Length; i++)
		{
			float num2 = radii[x];
			float num3 = radii[i];
			float b = (positions[x] - positions[i]).magnitude + num2 + num3;
			b = Mathf.Max(2f * num2, b);
			b = Mathf.Max(2f * num3, b);
			if (b > num)
			{
				result = i;
				num = b;
			}
		}
		return result;
	}
}
