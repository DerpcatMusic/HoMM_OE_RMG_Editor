using System.Collections.Generic;
using TMPro;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhDropFilters : MonoBehaviour
	{
		[SerializeField]
		private List<TMP_Dropdown> drops;

		[SerializeField]
		private BhEditorItemsListView list;

		private string buoz;

		public void OnChange()
		{
		}
	}
}
