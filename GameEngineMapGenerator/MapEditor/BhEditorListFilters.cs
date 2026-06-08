using System.Collections.Generic;
using UnityEngine;

namespace Hex.MapEditor
{
	public class BhEditorListFilters : MonoBehaviour
	{
		[SerializeField]
		private BhEditorItemsListView view;

		[SerializeField]
		private bsj group;

		[SerializeField]
		private bsj altGroup;

		[SerializeField]
		private Transform filterParent;

		[SerializeField]
		private Transform altFilterParent;

		[SerializeField]
		private BhEditorListSubButton filterPrefab;

		private bool bupl;

		private bool bupm;

		public void npa(HashSet<string> a)
		{
		}

		public void npb(HashSet<string> a)
		{
		}

		public void npc()
		{
		}
	}
}
