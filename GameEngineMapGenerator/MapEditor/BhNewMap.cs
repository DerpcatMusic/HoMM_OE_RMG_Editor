using System.Collections.Generic;
using Hex.UI;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhNewMap : BhScreenElement
	{
		[SerializeField]
		private TMP_InputField label;

		[SerializeField]
		private TMP_InputField description;

		[SerializeField]
		private TMP_Dropdown dropdown;

		private List<MapSize> buja;

		private void Start()
		{
		}

		public void OnBtn()
		{
		}
	}
}
