using System;
using UnityEngine;

namespace Hex
{
	[Serializable]
	public class JsonDateTime
	{
		[SerializeField]
		private long value;

		public JsonDateTime(DateTime _dt)
		{
		}

		public DateTime hnr()
		{
			return default(DateTime);
		}

		public DateTime hns()
		{
			return default(DateTime);
		}
	}
}
