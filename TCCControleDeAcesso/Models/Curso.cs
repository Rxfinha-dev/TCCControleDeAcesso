using System;
using System.Data;
using System.Windows.Forms;
using MySql.Data.MySqlClient;

namespace TCCControleDeAcesso.Models
{
    public class Curso
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int idEscola { get; set; }


        public void Insert(int _idEscola)
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("insert into cursos(nome, idEscola) values(@Nome, @IdEscola)", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@Nome", Name);
                Banco.Command.Parameters.AddWithValue("@idEscola", _idEscola);
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }catch(Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Inserir Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public DataTable ListCourses(int _idEscola)
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("select id, nome from cursos where idEscola=@idEscola", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@idEscola", _idEscola);
                Banco.DataAdapter = new MySqlDataAdapter(Banco.Command);
                Banco.datTable = new DataTable();
                Banco.DataAdapter.Fill(Banco.datTable);
                Banco.CloseConnection();
                return Banco.datTable;
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Listar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
                return null;
            }
        }

        public void Delete()
        {
            try
            {
                Banco.OpenConnection();
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("delete from cursos where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }
            catch (Exception e) {
                MessageBox.Show(e.Message, "Erro Ao Deletar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void Update()
        {
            try
            {
                Banco.OpenConnection();
                Banco.Command = new MySqlCommand("update Alunos set nome = @nome where id = @id", Banco.Connection);
                Banco.Command.Parameters.AddWithValue("@id", Id);              
                Banco.Command.ExecuteNonQuery();
                Banco.CloseConnection();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.Message, "Erro Ao Atualizar Dados!", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

    }
}
