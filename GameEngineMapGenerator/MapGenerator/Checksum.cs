using System;
using System.Security.Cryptography;
using System.Text;
using Hex.Map;
using UnityEngine;

namespace Hex.MapGenerator;

public class Checksum
{
	private MD5 hasher = MD5.Create();

	public string Compute(MapData data)
	{
		string s = JsonUtility.ToJson(data);
		byte[] bytes = Encoding.UTF8.GetBytes(s);
		return BitConverter.ToString(hasher.ComputeHash(bytes));
	}
}
