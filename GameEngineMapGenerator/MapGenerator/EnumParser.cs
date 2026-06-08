using System;
using System.Collections.Generic;

namespace Hex.MapGenerator;

public static class EnumParser
{
	private class EnumData<T>
	{
		public T defaultValue;

		public Dictionary<string, T> valueTable;

		public EnumData(T defaultValue, Dictionary<string, T> valueTable)
		{
			this.defaultValue = defaultValue;
			this.valueTable = valueTable;
		}
	}

	private static Dictionary<Type, object> enumDatas = new Dictionary<Type, object>();

	public static bool TryParceEnum<T>(string arg, out T value) where T : Enum
	{
		EnumData<T> valueTable = GetValueTable<T>();
		if (valueTable.valueTable.TryGetValue(arg, out value))
		{
			return true;
		}
		value = valueTable.defaultValue;
		return false;
	}

	private static EnumData<T> GetValueTable<T>() where T : Enum
	{
		Type typeFromHandle = typeof(T);
		if (enumDatas.TryGetValue(typeFromHandle, out var value))
		{
			return value as EnumData<T>;
		}
		Array values = Enum.GetValues(typeof(T));
		Dictionary<string, T> dictionary = new Dictionary<string, T>();
		foreach (T item in values)
		{
			dictionary.Add(item.ToString(), item);
		}
		EnumData<T> enumData = new EnumData<T>((T)values.GetValue(0), dictionary);
		enumDatas[typeFromHandle] = enumData;
		return enumData;
	}
}
