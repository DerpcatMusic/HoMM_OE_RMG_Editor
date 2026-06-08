using System.Collections.Generic;
using Hex.Configs;
using Hex.UI;
using UnityEngine;

namespace Hex
{
	public class BhUnitPreviews : MonoBehaviour
	{
		public const float HireBackgroundOffset = -1.37f;

		public static BhUnitPreviews me;

		[SerializeField]
		private cls prefab;

		[SerializeField]
		private List<BhUnitPreview> cams;

		private Dictionary<string, Queue<cls>> bpmv;

		private Queue<BhUnitPreview> bpmw;

		private Dictionary<string, Texture> bpmx;

		private Texture bpmy;

		private void Start()
		{
		}

		private void hsx()
		{
		}

		public bool hsy(string a, float b, out cls c)
		{
			c = null;
			return false;
		}

		public void hsz(cls a)
		{
		}

		public BhUnitPreview hta()
		{
			return null;
		}

		public void htb(BhUnitPreview a)
		{
		}

		private cls htc(UnitViewConfig a)
		{
			return null;
		}

		private Texture htd(string a)
		{
			return null;
		}
	}
}
