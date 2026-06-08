using UnityEngine;

namespace Hex.MapGenerator;

public static class Direction
{
	public static int FromVector(Vector2Int dir)
	{
		if (dir.x == 0 && dir.y == 1)
		{
			return 0;
		}
		if (dir.x == 1 && dir.y == 0)
		{
			return 1;
		}
		if (dir.x == 0 && dir.y == -1)
		{
			return 2;
		}
		if (dir.x == -1 && dir.y == 0)
		{
			return 3;
		}
		return -1;
	}

	public static Vector2Int FromIndex(int index)
	{
		return index switch
		{
			0 => Vector2Int.up, 
			1 => Vector2Int.right, 
			2 => Vector2Int.down, 
			3 => Vector2Int.left, 
			_ => Vector2Int.zero, 
		};
	}

	public static int Clockwise(int index)
	{
		return (index + 1) % 4;
	}

	public static int AntiClockwise(int index)
	{
		index--;
		if (index < 0)
		{
			index += 4;
		}
		return index;
	}

	public static int Inverse(int index)
	{
		return (index + 2) % 4;
	}
}
