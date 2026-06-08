using System.Collections.Generic;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhNewGenMap : BhScreenElement
	{
		[SerializeField]
		private TMP_Dropdown dropdown;

		[SerializeField]
		private TMP_InputField template;

		[SerializeField]
		private TMP_InputField seed;

		private List<MapSize> buiz;

		private void Start()
		{
		}

		public void OnBtn()
		{
		}
	}
}
